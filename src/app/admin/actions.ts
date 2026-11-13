"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession, logActivity, requireRole, type AdminSession } from "@/lib/admin/auth";
import { buildPayload } from "@/lib/admin/payload";
import { collectValues, type FormState } from "@/lib/admin/form-state";
import { getResource, leadStatuses, type Resource, type Role } from "@/lib/admin/resources";
import { mediaPathFromUrl, mediaPublicPrefix, safeFileName, validateMedia } from "@/lib/media";
import { rateLimit } from "@/lib/rate-limit";

const back = (path: string, params: Record<string, string>) =>
  redirect(`${path}?${new URLSearchParams(params)}`);

const publicRefresh = () => revalidatePath("/", "layout");
const prefix = () => mediaPublicPrefix(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Resposta de erro dos formulários: mantém tudo o que foi digitado (`values`) e aponta o campo com
 * problema (`fieldErrors`). O formulário NUNCA é limpo por causa de erro; só o sucesso redireciona.
 */
const fail = (formData: FormData, error: string, field?: string): FormState => ({
  error: field ? "Corrija o campo destacado e salve novamente. Seus dados foram mantidos." : error,
  fieldErrors: field ? { [field]: error } : undefined,
  values: collectValues(formData),
});

// ───────────── sessão ─────────────
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  // só o e-mail volta ao formulário; a senha nunca é devolvida
  const values = { email: String(formData.get("email") ?? "").trim() };
  const supabase = await createClient();
  if (!supabase) return { error: "O painel não está configurado (Supabase).", values };

  // Limite por IP contra tentativa de senhas (o Supabase também aplica limites próprios).
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`login:${ip}`, 8, 10 * 60 * 1000))
    return { error: "Muitas tentativas. Aguarde alguns minutos.", values };

  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "E-mail ou senha incorretos.", values };
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

// ───────────── upload direto (URL assinada) ─────────────
type UploadUrl = { ok: true; path: string; token: string } | { ok: false; error: string };

/** Pasta e regras de um campo de mídia, ou null se o papel/campo não tem permissão. */
function uploadScope(s: AdminSession, resourceKey: string, fieldName: string) {
  if (resourceKey === "configuracoes") {
    if (s.role !== "admin" || !["logo_url", "favicon_url"].includes(fieldName)) return null;
    return { folder: "settings", allowVideo: false };
  }
  const resource = getResource(resourceKey);
  const field = resource?.fields.find((f) => f.name === fieldName && f.type === "image");
  if (!resource || !field || !resource.roles.includes(s.role)) return null;
  return { folder: resource.table, allowVideo: fieldName === "url" };
}

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
  const scope = uploadScope(s, resourceKey, fieldName);
  if (!scope) return { ok: false, error: "Sem permissão." };

  const problem = validateMedia({ size, type }, scope.allowVideo);
  if (problem) return { ok: false, error: problem };

  const path = `${scope.folder}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
  const { data, error } = await s.supabase.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Não foi possível iniciar o envio." };
  return { ok: true, path, token: data.token };
}

/** URLs de mídia em uso (qualquer tabela). Usado para nunca descartar um arquivo referenciado. */
async function isReferenced(s: AdminSession, url: string) {
  const columns: [string, string][] = [
    ["projects", "cover_url"],
    ["project_media", "url"],
    ["services", "banner_url"],
    ["products", "cover_url"],
    ["product_media", "url"],
    ["banners", "image_url"],
    ["articles", "cover_url"],
  ];
  for (const [table, column] of columns) {
    const { count } = await s.supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, url);
    if (count) return true;
  }
  const { data } = await s.supabase.from("site_settings").select("value");
  return (data ?? []).some((r) => r.value === url);
}

/**
 * Descarta um arquivo enviado nesta sessão de edição e que ficou sem uso (o usuário trocou ou
 * removeu a imagem antes de salvar). Só apaga se estiver na pasta do campo e sem nenhuma referência
 * no banco, evitando arquivos órfãos no Storage.
 */
export async function discardUpload(resourceKey: string, fieldName: string, url: string) {
  const s = await getAdminSession();
  if (!s) return { ok: false };
  const scope = uploadScope(s, resourceKey, fieldName);
  const path = mediaPathFromUrl(url, prefix());
  if (!scope || !path || !path.startsWith(`${scope.folder}/`)) return { ok: false };
  if (await isReferenced(s, url)) return { ok: false };
  await s.supabase.storage.from("media").remove([path]);
  return { ok: true };
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
export async function saveResource(
  key: string,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const resource = getResource(key);
  if (!resource) redirect("/admin");
  const s = await requireRole(resource.roles);
  const base = `/admin/${key}`;
  const keep = new URLSearchParams();
  // Só relações OBRIGATÓRIAS (o "pai": projeto da mídia, departamento do item) voltam como filtro
  // da lista; categoria/cliente opcionais não podem filtrar a lista depois de salvar.
  for (const f of resource.fields)
    if (f.type === "relation" && f.required) {
      const v = formData.get(f.name);
      if (typeof v === "string" && v) keep.set(f.name, v);
    }

  const { payload, error, field } = buildPayload(resource, (n) => formData.get(n), !id, {
    mediaPrefix: prefix(),
  });
  if (error) return fail(formData, error, field);
  // Mídias: o tipo vem do arquivo enviado, não do select (evita vídeo gravado como "image").
  if ("kind" in payload && typeof payload.url === "string")
    payload.kind = /\.(mp4|webm)$/i.test(payload.url) ? "video" : "image";
  for (const f of resource.fields)
    if (f.type === "image" && f.required && !payload[f.name])
      return fail(formData, `Envie “${f.label}”.`, f.name);

  try {
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
      const { field: pf, kind } = resource.publish;
      const published = kind === "status" ? payload[pf] === "published" : payload[pf] === true;
      if (published && !previous?.published_at) payload.published_at = new Date().toISOString();
    }

    const query = id
      ? s.supabase.from(resource.table).update(payload).eq("id", id).select("id").single()
      : s.supabase.from(resource.table).insert(payload).select("id").single();
    const { data, error: dbErr } = await query;
    if (dbErr) {
      if (dbErr.code === "23505") {
        const unique = resource.fields.find((f) => f.name === "slug" || f.name === "key");
        return fail(formData, "Já existe um registro com este valor. Escolha outro.", unique?.name);
      }
      return fail(
        formData,
        "Não foi possível salvar agora. Seus dados foram mantidos; tente novamente.",
      );
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
  } catch (e) {
    unstable_rethrow(e); // redirects/not-found do Next passam; qualquer outra falha vira mensagem
    return fail(
      formData,
      "Erro inesperado no servidor. Seus dados foram mantidos; tente novamente.",
    );
  }

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
export async function updateLead(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const s = await requireRole(["admin", "sales"]);
  const status = String(formData.get("status") ?? "");
  if (!leadStatuses.some((l) => l.value === status))
    return fail(formData, "Status inválido.", "status");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (notes && notes.length > 5000) return fail(formData, "Máximo de 5000 caracteres.", "notes");
  try {
    const { error } = await s.supabase.from("leads").update({ status, notes }).eq("id", id);
    if (error)
      return fail(
        formData,
        "Não foi possível salvar agora. Suas anotações foram mantidas; tente novamente.",
      );
    await logActivity(s, "update", "leads", id, { status });
  } catch (e) {
    unstable_rethrow(e);
    return fail(
      formData,
      "Erro inesperado no servidor. Suas anotações foram mantidas; tente novamente.",
    );
  }
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

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireRole(["admin"]);
  const rows: { key: string; value: string }[] = [];
  for (const key of SETTING_KEYS) {
    const value = String(formData.get(key) ?? "").trim();
    if (key === "analytics_id" && value && !/^G-[A-Z0-9]+$/.test(value))
      return fail(formData, "O ID do Google Analytics deve ter o formato G-XXXXXXXXXX.", key);
    if (key === "instagram" && value && !/^https?:\/\//.test(value))
      return fail(
        formData,
        "O Instagram deve ser uma URL que comece com http:// ou https://.",
        key,
      );
    if (key === "email" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
      return fail(formData, "Informe um e-mail válido.", key);
    if ((key === "logo_url" || key === "favicon_url") && value && !value.startsWith(prefix()))
      return fail(formData, "Arquivo inválido. Envie novamente.", key);
    rows.push({ key, value });
  }

  try {
    const { data: old } = await s.supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["logo_url", "favicon_url"]);
    const { error } = await s.supabase.from("site_settings").upsert(rows);
    if (error)
      return fail(
        formData,
        "Não foi possível salvar agora. Seus dados foram mantidos; tente novamente.",
      );

    const next = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    await removeMedia(
      s,
      (old ?? []).filter((o) => o.value && o.value !== next[o.key]).map((o) => o.value),
    );
    await logActivity(s, "update", "site_settings", null);
    publicRefresh();
  } catch (e) {
    unstable_rethrow(e);
    return fail(
      formData,
      "Erro inesperado no servidor. Seus dados foram mantidos; tente novamente.",
    );
  }
  redirect("/admin/configuracoes?salvo=1");
}

// ───────────── usuários ─────────────
export async function inviteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const s = await requireRole(["admin"]);
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor") as Role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return fail(formData, "Informe um e-mail válido.", "email");
  if (!["admin", "editor", "sales"].includes(role))
    return fail(formData, "Papel inválido.", "role");
  const admin = createAdminClient();
  if (!admin) return fail(formData, "Defina SUPABASE_SERVICE_ROLE_KEY para convidar usuários.");
  try {
    // O link do e-mail leva à página de definição de senha do próprio site (origem da requisição).
    const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/admin/definir-senha`,
    });
    if (error?.status === 429)
      return fail(
        formData,
        "Limite de e-mails do Supabase atingido (o envio padrão permite poucos por hora). Configure um SMTP próprio em Authentication → SMTP ou tente mais tarde.",
      );
    if (error || !data.user)
      return fail(formData, "Não foi possível enviar o convite agora. Tente novamente.");
    await admin.from("profiles").update({ role, active: true }).eq("id", data.user.id);
    await logActivity(s, "invite", "profiles", data.user.id, { email, role });
  } catch (e) {
    unstable_rethrow(e);
    return fail(formData, "Erro inesperado no servidor. Tente novamente.");
  }
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
