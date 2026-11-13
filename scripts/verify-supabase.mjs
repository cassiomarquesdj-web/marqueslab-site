// Teste de integração contra um projeto Supabase REAL (homologação).
//
//   node --env-file=.env.local scripts/verify-supabase.mjs
//
// Cria 3 usuários temporários (admin/editor/comercial), exercita permissões, CRUD, orçamentos,
// histórico, clientes e Storage, e remove tudo no final. USE APENAS EM PROJETO DE HOMOLOGAÇÃO:
// por segurança exige HOMOLOG_CONFIRM=sim. Não toca em dados existentes (tudo usa o prefixo "zz-homolog").
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(2);
}
console.log(`Projeto alvo: ${new URL(url).host}`);
if (process.env.HOMOLOG_CONFIRM !== "sim") {
  console.error(
    "Este script cria e remove dados de teste. Rode com HOMOLOG_CONFIRM=sim apenas em homologação.",
  );
  process.exit(2);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, opts);
const stamp = Date.now();
const P = `zz-homolog-${stamp}`;
const password = `Hm!${stamp}aA1`;

let pass = 0;
let fail = 0;
const t = async (name, fn) => {
  try {
    const ok = await fn();
    if (ok === false) throw new Error("asserção falhou");
    pass++;
    console.log("✓", name);
  } catch (e) {
    fail++;
    console.log("✗ FALHOU:", name, "→", e?.message ?? e);
  }
};

const users = {};
const cleanup = { rows: [], files: [], leadFiles: [] };

async function makeUser(role) {
  const email = `${P}-${role}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${P} ${role}` },
  });
  if (error) throw error;
  await admin.from("profiles").update({ role, active: true }).eq("id", data.user.id);
  const c = createClient(url, anonKey, opts);
  const { error: e2 } = await c.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  users[role] = { id: data.user.id, db: c };
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const anon = createClient(url, anonKey, opts);

try {
  for (const r of ["admin", "editor", "sales"]) await makeUser(r);
  const {
    admin: A,
    editor: E,
    sales: S,
  } = Object.fromEntries(Object.entries(users).map(([k, v]) => [k === "admin" ? "admin" : k, v]));

  // ───────── login e papéis ─────────
  for (const [role, u] of Object.entries(users))
    await t(`login ${role}: perfil com papel correto`, async () => {
      const { data } = await u.db.from("profiles").select("role,active").eq("id", u.id).single();
      return data?.role === role && data.active === true;
    });
  await t("editor não promove a si mesmo a admin", async () => {
    const { data } = await E.db.from("profiles").update({ role: "admin" }).eq("id", E.id).select();
    return (data ?? []).length === 0;
  });

  // ───────── CRUD de conteúdo: projetos ─────────
  let projectId;
  await t("editor cria projeto (rascunho)", async () => {
    const { data, error } = await E.db
      .from("projects")
      .insert({ slug: `${P}-proj`, title: "Projeto teste", status: "draft" })
      .select("id")
      .single();
    projectId = data?.id;
    if (projectId) cleanup.rows.push(["projects", projectId]);
    return !error && !!projectId;
  });
  await t(
    "rascunho NÃO é visível ao público",
    async () => (await anon.from("projects").select("id").eq("id", projectId)).data?.length === 0,
  );
  await t("editor publica o projeto", async () => {
    const { error } = await E.db
      .from("projects")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", projectId);
    return !error;
  });
  await t(
    "projeto publicado é visível ao público",
    async () => (await anon.from("projects").select("id").eq("id", projectId)).data?.length === 1,
  );
  await t(
    "comercial NÃO altera projeto",
    async () =>
      ((await S.db.from("projects").update({ title: "x" }).eq("id", projectId).select()).data ?? [])
        .length === 0,
  );
  await t(
    "slug duplicado é recusado (23505)",
    async () =>
      (await E.db.from("projects").insert({ slug: `${P}-proj`, title: "dup" })).error?.code ===
      "23505",
  );

  // ───────── serviços, itens, produtos, banners, artigos ─────────
  let serviceId;
  await t("editor cria departamento e item de serviço", async () => {
    const s = await E.db
      .from("services")
      .insert({ slug: `${P}-svc`, name: "Depto teste", category: "Motion" })
      .select("id")
      .single();
    serviceId = s.data?.id;
    if (serviceId) cleanup.rows.push(["services", serviceId]);
    const i = await E.db
      .from("service_items")
      .insert({ service_id: serviceId, title: "Item teste" });
    return !s.error && !i.error;
  });
  await t("público lê departamento ativo com seus itens", async () => {
    const { data } = await anon
      .from("services")
      .select("slug,service_items(title)")
      .eq("id", serviceId)
      .single();
    return data?.service_items?.length === 1;
  });
  await t("editor desativa departamento → some do público", async () => {
    await E.db.from("services").update({ active: false }).eq("id", serviceId);
    return (await anon.from("services").select("id").eq("id", serviceId)).data?.length === 0;
  });
  let productId;
  await t("editor cria produto com status", async () => {
    const { data, error } = await E.db
      .from("products")
      .insert({
        slug: `${P}-prod`,
        name: "Produto teste",
        status: "em_testes",
        features: ["a", "b"],
      })
      .select("id")
      .single();
    productId = data?.id;
    if (productId) cleanup.rows.push(["products", productId]);
    return !error && !!productId;
  });
  await t("produto despublicado some do público", async () => {
    await E.db.from("products").update({ published: false }).eq("id", productId);
    return (await anon.from("products").select("id").eq("id", productId)).data?.length === 0;
  });
  await t("editor cria e edita banner; inativo é oculto", async () => {
    const b = await E.db
      .from("banners")
      .insert({ key: `${P}-banner`, title: "B", active: false })
      .select("id")
      .single();
    if (b.data?.id) cleanup.rows.push(["banners", b.data.id]);
    const up = await E.db.from("banners").update({ title: "B2" }).eq("id", b.data.id);
    return (
      !b.error &&
      !up.error &&
      (await anon.from("banners").select("id").eq("id", b.data.id)).data?.length === 0
    );
  });
  await t("editor cria artigo em rascunho; comercial não vê", async () => {
    const a = await E.db
      .from("articles")
      .insert({ slug: `${P}-art`, title: "A" })
      .select("id")
      .single();
    if (a.data?.id) cleanup.rows.push(["articles", a.data.id]);
    return (
      !a.error && (await S.db.from("articles").select("id").eq("id", a.data.id)).data?.length === 0
    );
  });

  // ───────── configurações ─────────
  await t("somente admin altera configurações", async () => {
    const e = await E.db.from("site_settings").upsert({ key: `${P}-key`, value: "x" });
    const a = await A.db.from("site_settings").upsert({ key: `${P}-key`, value: "ok" });
    cleanup.rows.push(["site_settings", `${P}-key`, "key"]);
    return !!e.error && !a.error;
  });

  // ───────── orçamentos, histórico, clientes ─────────
  let leadId;
  await t("API (service role) grava orçamento com protocolo ML-######", async () => {
    const { data, error } = await admin
      .from("leads")
      .insert({
        name: `${P} Maria`,
        whatsapp: "91999999999",
        email: "maria@example.com",
        category: "Motion",
        description: "Orçamento de teste automatizado.",
      })
      .select("id,protocol,status")
      .single();
    leadId = data?.id;
    if (leadId) cleanup.rows.push(["leads", leadId]);
    return !error && /^ML-\d{6}$/.test(data.protocol) && data.status === "novo";
  });
  await t(
    "anônimo NÃO grava orçamento direto",
    async () =>
      !!(
        await anon.from("leads").insert({
          name: "xx",
          whatsapp: "91999999999",
          email: "a@b.co",
          category: "Motion",
          description: "descricao longa ok",
        })
      ).error,
  );
  await t(
    "anônimo e editor NÃO leem orçamentos",
    async () =>
      (await anon.from("leads").select("id")).data?.length === 0 &&
      (await E.db.from("leads").select("id").eq("id", leadId)).data?.length === 0,
  );
  await t("comercial lê e atualiza status/observação", async () => {
    const { data, error } = await S.db
      .from("leads")
      .update({ status: "em_analise", notes: "retornar amanhã" })
      .eq("id", leadId)
      .select("id");
    return !error && data?.length === 1;
  });
  await t("histórico registra criação, status e nota com autor", async () => {
    const { data } = await S.db.from("lead_history").select("action,author").eq("lead_id", leadId);
    const acts = (data ?? [])
      .map((h) => h.action)
      .sort()
      .join(",");
    return (
      acts === "created,note,status" && data.some((h) => h.action === "status" && h.author === S.id)
    );
  });
  await t(
    "editor NÃO lê histórico",
    async () =>
      (await E.db.from("lead_history").select("id").eq("lead_id", leadId)).data?.length === 0,
  );
  let clientId;
  await t("comercial cria cliente e vincula ao orçamento", async () => {
    const c = await S.db
      .from("clients")
      .insert({ name: `${P} Cliente`, email: "cliente@example.com", phone: "91999999999" })
      .select("id")
      .single();
    clientId = c.data?.id;
    if (clientId) cleanup.rows.push(["clients", clientId]);
    const l = await S.db
      .from("leads")
      .update({ client_id: clientId })
      .eq("id", leadId)
      .select("id");
    return !c.error && l.data?.length === 1;
  });
  await t("editor NÃO lê clientes, mas lê client_options (só id+nome)", async () => {
    const full = await E.db.from("clients").select("email").eq("id", clientId);
    const opt = await E.db.from("client_options").select("id,name").eq("id", clientId);
    return full.data?.length === 0 && opt.data?.length === 1 && !("email" in opt.data[0]);
  });
  await t(
    "anônimo NÃO lê client_options",
    async () =>
      !!(await anon.from("client_options").select("id")).error ||
      (await anon.from("client_options").select("id")).data?.length === 0,
  );

  // ───────── Storage: media ─────────
  const path = `${P}/teste.png`;
  await t("editor envia imagem ao bucket media", async () => {
    const { error } = await E.db.storage
      .from("media")
      .upload(path, png, { contentType: "image/png" });
    if (!error) cleanup.files.push(path);
    return !error;
  });
  await t(
    "imagem é pública (HTTP 200)",
    async () =>
      (await fetch(anon.storage.from("media").getPublicUrl(path).data.publicUrl)).status === 200,
  );
  await t("comercial e anônimo NÃO enviam ao media", async () => {
    const s = await S.db.storage
      .from("media")
      .upload(`${P}/s.png`, png, { contentType: "image/png" });
    const a = await anon.storage
      .from("media")
      .upload(`${P}/a.png`, png, { contentType: "image/png" });
    return !!s.error && !!a.error;
  });
  await t(
    "bucket recusa SVG (tipo não permitido)",
    async () =>
      !!(
        await E.db.storage
          .from("media")
          .upload(`${P}/x.svg`, Buffer.from("<svg/>"), { contentType: "image/svg+xml" })
      ).error,
  );
  await t("upload direto por URL assinada (fluxo do painel, vídeo)", async () => {
    const vpath = `${P}/video.mp4`;
    const { data, error } = await E.db.storage.from("media").createSignedUploadUrl(vpath);
    if (error) return false;
    const up = await E.db.storage
      .from("media")
      .uploadToSignedUrl(vpath, data.token, Buffer.alloc(2048, 1), { contentType: "video/mp4" });
    if (!up.error) cleanup.files.push(vpath);
    return !up.error;
  });
  await t(
    "comercial NÃO obtém URL assinada de upload",
    async () => !!(await S.db.storage.from("media").createSignedUploadUrl(`${P}/s2.png`)).error,
  );
  await t("editor exclui arquivo; comercial não", async () => {
    const s = await S.db.storage.from("media").remove([path]);
    const stillThere =
      (await fetch(anon.storage.from("media").getPublicUrl(path).data.publicUrl)).status === 200;
    const e = await E.db.storage.from("media").remove([path]);
    // A URL pública pode continuar em cache na CDN por um tempo após a exclusão; o parâmetro
    // aleatório força a consulta à origem e confirma que o objeto realmente foi removido.
    const gone =
      (
        await fetch(
          `${anon.storage.from("media").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`,
        )
      ).status !== 200;
    return stillThere && !e.error && gone && (s.data ?? []).length === 0;
  });

  // ───────── Storage: lead-references (privado) ─────────
  const lref = `${P}/ref.png`;
  await t("anexo de orçamento: service role grava; anônimo não lê", async () => {
    const up = await admin.storage
      .from("lead-references")
      .upload(lref, png, { contentType: "image/png" });
    if (!up.error) cleanup.leadFiles.push(lref);
    const pub = await fetch(`${url}/storage/v1/object/public/lead-references/${lref}`);
    return !up.error && pub.status !== 200;
  });
  await t("comercial gera URL assinada do anexo; editor não", async () => {
    const s = await S.db.storage.from("lead-references").createSignedUrl(lref, 60);
    const e = await E.db.storage.from("lead-references").createSignedUrl(lref, 60);
    return !s.error && !!e.error;
  });
  await t(
    "bucket lead-references recusa arquivo > 4 MB",
    async () =>
      !!(
        await admin.storage
          .from("lead-references")
          .upload(`${P}/big.png`, Buffer.alloc(4.5 * 1024 * 1024, 1), { contentType: "image/png" })
      ).error,
  );

  // ───────── exclusão em cascata ─────────
  await t("excluir projeto remove suas mídias (cascata)", async () => {
    await E.db
      .from("project_media")
      .insert({ project_id: projectId, url: "https://example.com/x.png" });
    await E.db.from("projects").delete().eq("id", projectId);
    return (
      (await admin.from("project_media").select("id").eq("project_id", projectId)).data?.length ===
      0
    );
  });
} catch (e) {
  fail++;
  console.log("✗ ERRO FATAL:", e?.message ?? e);
} finally {
  // limpeza (service role): linhas, arquivos e usuários de teste
  for (const [table, id, col = "id"] of cleanup.rows) await admin.from(table).delete().eq(col, id);
  await admin.from("leads").delete().like("name", `${P}%`);
  await admin.from("clients").delete().like("name", `${P}%`);
  if (cleanup.files.length) await admin.storage.from("media").remove(cleanup.files);
  if (cleanup.leadFiles.length)
    await admin.storage.from("lead-references").remove(cleanup.leadFiles);
  for (const u of Object.values(users)) await admin.auth.admin.deleteUser(u.id);
  console.log(`\n${pass} ok, ${fail} falha(s). Dados de teste removidos.`);
  process.exit(fail === 0 ? 0 : 1);
}
