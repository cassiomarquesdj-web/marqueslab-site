"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession, logActivity, requireRole, type AdminSession } from "@/lib/admin/auth";
import { buildPayload } from "@/lib/admin/payload";
import { getResource, leadStatuses, type Resource, type Role } from "@/lib/admin/resources";
import { mediaPathFromUrl, mediaPublicPrefix, safeFileName, validateMedia } from "@/lib/media";
import { rateLimit } from "@/lib/rate-limit";

const back = (path: string, params: Record<string, string>) =>
  redirect(`${path}?${new URLSearchParams(params)}`);

const publicRefresh = () => revalidatePath("/", "layout");
const prefix = () => mediaPublicPrefix(process.env.NEXT_PUBLIC_SUPABASE_URL);

// ───────────── sessão ─────────────
export async function login(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return back("/admin/login", { erro: "config" });

  // Limite por IP contra tentativa de senhas (o Supabase também aplica limites próprios).
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`login:${ip}`, 8, 10 * 60 * 1000)) return back("/admin/login", { erro: "limite" });

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return back("/admin/login", { erro: "credenciais" });
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

// ───────────── upload direto (URL assinada) ─────────────
type UploadUrl = { ok: true; path: string; token: string } | { ok: false; error: string };

/**
 * Autoriza um upload direto do navegador ao Supabase Storage (o arquivo não passa pelo servidor,
 * então não esbarra no limite de 4,5 MB da Vercel). Valida papel, campo, tipo e tamanho;
 * o bucket repete essas regras (migração 0003).
 */
export async function createUploadUrl(
  resourceKey: string,
  fieldName: string,
  fileName: string,
  size: number,
  type: string,
): Promise<UploadUrl> {
  const s = await getAdminSession();
  if (!s) return { ok: false, error: "Sessão expirada. Entre novamente." };

  let folder: string;
  let allowVideo: boolean;
  if (resourceKey === "configuracoes") {
    if (s.role !== "admin" || !["logo_url", "favicon_url"].includes(fieldName))
      return { ok: false, error: "Sem permissão." };
    folder = "settings";
    allowVideo = false;
  } else {
    const resource = getResource(resourceKey);
    const field = resource?.fields.find((f) => f.name === fieldName && f.type === "image");
    if (!resource || !field || !resource.roles.includes(s.role))
      return { ok: false, error: "Sem permissão." };
    folder = resource.table;
    allowVideo = fieldName === "url";
  }

  const problem = validateMedia({ size, type }, allowVideo);
  if (problem) return { ok: false, error: problem };

  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
  const { data, error } = await s.supabase.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Não foi possível iniciar o envio." };
  return { ok: true, path, token: data.token };
}

/** Remove do Storage os arquivos (URLs públicas do bucket media) que deixaram de ser usados. */
async function removeMedia(s: AdminSession, urls: (unknown | null | undefined)[]) {
  const paths = urls
    .map((u) => (typeof u === "string" ? mediaPathFromUrl(u, prefix()) : null))
    .filter((p): p is string => !!p);
  if (paths.length) await s.supabase.storage.from("media").remove(paths);
}

const imageFields = (r: Resource) => r.fields.filter((f) => f.type === "image").map((f) => f.name);

// ───────────── CRUD genérico ─────────────
export async function saveResource(key: string, id: string | null, formData: FormData) {
  const resource = getResource(key);
  if (!resource) redirect("/admin");
  const s = await requireRole(resource.roles);
  const base = `/admin/${key}`;
  const target = id ? `${base}/${id}` : `${base}/novo`;
  const keep = new URLSearchParams();
  // Só relações OBRIGATÓRIAS (o "pai": projeto da mídia, departamento do item) voltam como filtro
  // da lista; categoria/cliente opcionais não podem filtrar a lista depois de salvar.
  for (const f of resource.fields)
    if (f.type === "relation" && f.required) {
      const v = formData.get(f.name);
      if (typeof v === "string" && v) keep.set(f.name, v);
    }

  const { payload, error } = buildPayload(resource, (n) => formData.get(n), !id, {
    mediaPrefix: prefix(),
  });
  if (error) return back(target, { erro: error, ...Object.fromEntries(keep) });
  // Mídias: o tipo vem do arquivo enviado, não do select (evita vídeo gravado como "image").
  if ("kind" in payload && typeof payload.url === "string")
    payload.kind = /\.(mp4|webm)$/i.test(payload.url) ? "video" : "image";
  for (const f of resource.fields)
    if (f.type === "image" && f.required && !payload[f.name])
      return back(target, { erro: `Envie “${f.label}”.`, ...Object.fromEntries(keep) });

  // valores anteriores: para saber se publicou antes e quais arquivos foram substituídos
  let previous: Record<string, unknown> | null = null;
  if (id) {
    const cols = [...imageFields(resource), "id"];
    if (resource.table === "projects" || resource.table === "articles") cols.push("published_at");
    const { data } = await s.supabase
      .from(resource.table)
      .select(cols.join(","))
      .eq("id", id)
      .maybeSingle();
    previous = (data as unknown as Record<string, unknown>) ?? null;
  }

  if (resource.publish && (resource.table === "projects" || resource.table === "articles")) {
    const { field, kind } = resource.publish;
    const published = kind === "status" ? payload[field] === "published" : payload[field] === true;
    if (published && !previous?.published_at) payload.published_at = new Date().toISOString();
  }

  const query = id
    ? s.supabase.from(resource.table).update(payload).eq("id", id).select("id").single()
    : s.supabase.from(resource.table).insert(payload).select("id").single();
  const { data, error: dbErr } = await query;
  if (dbErr) {
    const msg =
      dbErr.code === "23505"
        ? "Já existe um registro com este slug/chave."
        : "Não foi possível salvar. Verifique os dados e suas permissões.";
    return back(target, { erro: msg, ...Object.fromEntries(keep) });
  }

  if (previous)
    await removeMedia(
      s,
      imageFields(resource)
        .filter((n) => previous![n] && previous![n] !== payload[n])
        .map((n) => previous![n]),
    );

  await logActivity(s, id ? "update" : "create", resource.table, data.id, {
    title: String(payload[resource.titleField] ?? ""),
  });
  publicRefresh();
  const filter = [...keep.entries()][0];
  redirect(filter && !id ? `${base}?${new URLSearchParams([filter])}&salvo=1` : `${base}?salvo=1`);
}

export async function deleteResource(key: string, id: string) {
  const resource = getResource(key);
  if (!resource) redirect("/admin");
  const s = await requireRole(resource.roles);

  // arquivos do registro e dos filhos (que o banco apaga em cascata) ficariam órfãos no Storage
  const urls: unknown[] = [];
  const own = imageFields(resource);
  if (own.length) {
    const { data } = await s.supabase
      .from(resource.table)
      .select(own.join(","))
      .eq("id", id)
      .maybeSingle();
    if (data) urls.push(...Object.values(data as unknown as Record<string, unknown>));
  }
  for (const rel of resource.related ?? []) {
    const child = getResource(rel.resource);
    const cols = child ? imageFields(child) : [];
    if (!child || !cols.length) continue;
    const { data } = await s.supabase.from(child.table).select(cols.join(",")).eq(rel.fk, id);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[])
      urls.push(...Object.values(row));
  }

  const { error } = await s.supabase.from(resource.table).delete().eq("id", id);
  if (error) return back(`/admin/${key}`, { erro: "Não foi possível excluir." });
  await removeMedia(s, urls);
  await logActivity(s, "delete", resource.table, id);
  publicRefresh();
  redirect(`/admin/${key}?excluido=1`);
}

// ───────────── orçamentos ─────────────
export async function updateLead(id: string, formData: FormData) {
  const s = await requireRole(["admin", "sales"]);
  const status = String(formData.get("status") ?? "");
  if (!leadStatuses.some((l) => l.value === status))
    return back(`/admin/orcamentos/${id}`, { erro: "Status inválido." });
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const { error } = await s.supabase.from("leads").update({ status, notes }).eq("id", id);
  if (error) return back(`/admin/orcamentos/${id}`, { erro: "Não foi possível salvar." });
  await logActivity(s, "update", "leads", id, { status });
  redirect(`/admin/orcamentos/${id}?salvo=1`);
}

export async function createClientFromLead(id: string) {
  const s = await requireRole(["admin", "sales"]);
  const { data: lead } = await s.supabase
    .from("leads")
    .select("name,company,email,whatsapp,client_id")
    .eq("id", id)
    .single();
  if (!lead || lead.client_id) return redirect(`/admin/orcamentos/${id}`);
  const { data: client, error } = await s.supabase
    .from("clients")
    .insert({ name: lead.name, company: lead.company, email: lead.email, phone: lead.whatsapp })
    .select("id")
    .single();
  if (error || !client)
    return back(`/admin/orcamentos/${id}`, { erro: "Não foi possível criar o cliente." });
  await s.supabase.from("leads").update({ client_id: client.id }).eq("id", id);
  await logActivity(s, "create", "clients", client.id, { fromLead: id });
  redirect(`/admin/orcamentos/${id}?salvo=1`);
}

// ───────────── configurações ─────────────
const SETTING_KEYS = [
  "company_name",
  "company_info",
  "instagram",
  "whatsapp",
  "email",
  "seo_title",
  "seo_description",
  "analytics_id",
  "logo_url",
  "favicon_url",
] as const;

export async function saveSettings(formData: FormData) {
  const s = await requireRole(["admin"]);
  const rows: { key: string; value: string }[] = [];
  for (const key of SETTING_KEYS) {
    const value = String(formData.get(key) ?? "").trim();
    if (key === "analytics_id" && value && !/^G-[A-Z0-9]+$/.test(value))
      return back("/admin/configuracoes", {
        erro: "O ID do Google Analytics deve ter o formato G-XXXXXXXXXX.",
      });
    if (key === "instagram" && value && !/^https?:\/\//.test(value))
      return back("/admin/configuracoes", { erro: "O Instagram deve ser uma URL http(s)." });
    if ((key === "logo_url" || key === "favicon_url") && value && !value.startsWith(prefix()))
      return back("/admin/configuracoes", { erro: "Arquivo inválido. Envie novamente." });
    rows.push({ key, value });
  }

  const { data: old } = await s.supabase
    .from("site_settings")
    .select("key,value")
    .in("key", ["logo_url", "favicon_url"]);
  const { error } = await s.supabase.from("site_settings").upsert(rows);
  if (error) return back("/admin/configuracoes", { erro: "Não foi possível salvar." });

  const next = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  await removeMedia(
    s,
    (old ?? []).filter((o) => o.value && o.value !== next[o.key]).map((o) => o.value),
  );
  await logActivity(s, "update", "site_settings", null);
  publicRefresh();
  redirect("/admin/configuracoes?salvo=1");
}

// ───────────── usuários ─────────────
export async function inviteUser(formData: FormData) {
  const s = await requireRole(["admin"]);
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor") as Role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !["admin", "editor", "sales"].includes(role))
    return back("/admin/usuarios", { erro: "Dados inválidos." });
  const admin = createAdminClient();
  if (!admin)
    return back("/admin/usuarios", {
      erro: "Defina SUPABASE_SERVICE_ROLE_KEY para convidar usuários.",
    });
  // O link do e-mail leva à página de definição de senha do próprio site (origem da requisição).
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/admin/definir-senha`,
  });
  if (error?.status === 429)
    return back("/admin/usuarios", {
      erro: "Limite de e-mails do Supabase atingido (o envio padrão permite poucos por hora). Configure um SMTP próprio em Authentication → SMTP ou tente mais tarde.",
    });
  if (error || !data.user)
    return back("/admin/usuarios", { erro: "Não foi possível enviar o convite." });
  await admin.from("profiles").update({ role, active: true }).eq("id", data.user.id);
  await logActivity(s, "invite", "profiles", data.user.id, { email, role });
  redirect("/admin/usuarios?salvo=1");
}

export async function updateUser(id: string, formData: FormData) {
  const s = await requireRole(["admin"]);
  const role = String(formData.get("role") ?? "");
  const active = formData.get("active") === "on";
  if (!["admin", "editor", "sales"].includes(role))
    return back("/admin/usuarios", { erro: "Papel inválido." });
  if (id === s.userId && (!active || role !== "admin"))
    return back("/admin/usuarios", {
      erro: "Você não pode remover seu próprio acesso de administrador.",
    });
  const { error } = await s.supabase.from("profiles").update({ role, active }).eq("id", id);
  if (error) return back("/admin/usuarios", { erro: "Não foi possível salvar." });
  await logActivity(s, "update", "profiles", id, { role, active });
  redirect("/admin/usuarios?salvo=1");
}
