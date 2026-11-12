"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity, requireRole } from "@/lib/admin/auth";
import { buildPayload } from "@/lib/admin/payload";
import { getResource, leadStatuses, type Role } from "@/lib/admin/resources";

const back = (path: string, params: Record<string, string>) =>
  redirect(`${path}?${new URLSearchParams(params)}`);

const publicRefresh = () => revalidatePath("/", "layout");

// ───────────── sessão ─────────────
export async function login(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) return back("/admin/login", { erro: "config" });
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

// ───────────── CRUD genérico ─────────────
// A Vercel limita o corpo de requisições de funções a ~4,5 MB, então 4 MB é o teto prático.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/x-icon"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

/** SVG fica de fora (next/image não o otimiza e ele pode carregar scripts); vídeo só nos campos de mídia. */
const uploadAllowed = (file: File, fieldName: string) =>
  file.size <= MAX_UPLOAD_BYTES &&
  (IMAGE_TYPES.includes(file.type) || (fieldName === "url" && VIDEO_TYPES.includes(file.type)));

export async function saveResource(key: string, id: string | null, formData: FormData) {
  const resource = getResource(key);
  if (!resource) redirect("/admin");
  const s = await requireRole(resource.roles);
  const base = `/admin/${key}`;
  const target = id ? `${base}/${id}` : `${base}/novo`;
  const keep = new URLSearchParams();
  for (const f of resource.fields)
    if (f.type === "relation") {
      const v = formData.get(f.name);
      if (typeof v === "string" && v) keep.set(f.name, v);
    }

  const { payload, error } = buildPayload(resource, (n) => formData.get(n), !id);
  if (error) return back(target, { erro: error, ...Object.fromEntries(keep) });

  for (const f of resource.fields) {
    if (f.type !== "image") continue;
    const file = formData.get(f.name);
    if (file instanceof File && file.size > 0) {
      if (!uploadAllowed(file, f.name))
        return back(target, {
          erro: `Arquivo inválido em “${f.label}” (imagem PNG/JPG/WebP/GIF de até 4 MB).`,
        });
      const path = `${resource.table}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`;
      const { error: upErr } = await s.supabase.storage
        .from("media")
        .upload(path, await file.arrayBuffer(), { contentType: file.type });
      if (upErr) return back(target, { erro: "Falha no upload do arquivo." });
      payload[f.name] = s.supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    }
    if (f.required && !payload[f.name]) return back(target, { erro: `Envie “${f.label}”.` });
  }

  if (resource.publish) {
    const { field, kind } = resource.publish;
    const published = kind === "status" ? payload[field] === "published" : payload[field] === true;
    if (resource.table === "projects" || resource.table === "articles") {
      let hadDate = false;
      if (id) {
        const { data } = await s.supabase
          .from(resource.table)
          .select("published_at")
          .eq("id", id)
          .maybeSingle();
        hadDate = !!data?.published_at;
      }
      if (published && !hadDate) payload.published_at = new Date().toISOString();
    }
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
  const { error } = await s.supabase.from(resource.table).delete().eq("id", id);
  if (error) return back(`/admin/${key}`, { erro: "Não foi possível excluir." });
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
    let value = String(formData.get(key) ?? "").trim();
    if (key === "analytics_id" && value && !/^G-[A-Z0-9]+$/.test(value))
      return back("/admin/configuracoes", {
        erro: "O ID do Google Analytics deve ter o formato G-XXXXXXXXXX.",
      });
    if (key === "logo_url" || key === "favicon_url") {
      const file = formData.get(`${key}__file`);
      if (file instanceof File && file.size > 0) {
        if (!uploadAllowed(file, key))
          return back("/admin/configuracoes", { erro: "Arquivo inválido." });
        const path = `settings/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60)}`;
        const { error } = await s.supabase.storage
          .from("media")
          .upload(path, await file.arrayBuffer(), { contentType: file.type });
        if (error) return back("/admin/configuracoes", { erro: "Falha no upload." });
        value = s.supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      }
    }
    rows.push({ key, value });
  }
  const { error } = await s.supabase.from("site_settings").upsert(rows);
  if (error) return back("/admin/configuracoes", { erro: "Não foi possível salvar." });
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
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data.user)
    return back("/admin/usuarios", { erro: "Não foi possível enviar o convite." });
  await admin.from("profiles").update({ role }).eq("id", data.user.id);
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
