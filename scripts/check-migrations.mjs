// Valida migrações, seed e a matriz de permissões (RLS) em um Postgres em memória (PGlite),
// com stubs mínimos do Supabase (auth, storage). Não substitui o teste em um Supabase real
// (veja scripts/verify-supabase.mjs), mas pega erros de SQL e de política antes do deploy.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`);

for (const f of readdirSync("supabase/migrations").sort()) {
  await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  console.log("ok", f);
}
if (existsSync("supabase/seed.sql")) {
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  console.log("ok seed.sql");
}
// Supabase concede estes privilégios por padrão; o acesso real é decidido pelas políticas RLS.
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
revoke all on public.client_options from anon;`);

let failures = 0;
const check = (ok, msg) => {
  if (!ok) failures++;
  console.log(ok ? "✓" : "✗ FALHOU:", msg);
};
const q = async (sql) => (await db.query(sql)).rows;
/** Executa como `role`/uid. Retorna { rows } ou { denied: true } se o Postgres recusar. */
const as = async (role, uid, sql) => {
  await db.exec(`set role ${role}; select set_config('request.uid', '${uid ?? ""}', false);`);
  try {
    return { rows: (await db.query(sql)).rows };
  } catch (e) {
    return { denied: true, error: String(e.message) };
  } finally {
    await db.exec("reset role");
  }
};

const ADMIN = "00000000-0000-0000-0000-000000000001";
const EDITOR = "00000000-0000-0000-0000-000000000002";
const SALES = "00000000-0000-0000-0000-000000000003";
await db.exec(
  `insert into auth.users (id,email) values ('${ADMIN}','a@x.com'),('${EDITOR}','b@x.com'),('${SALES}','c@x.com');`,
);
const before = Object.fromEntries(
  (await q("select id, active from public.profiles")).map((r) => [r.id, r.active]),
);
check(
  before[ADMIN] === true && before[EDITOR] === false && before[SALES] === false,
  "primeiro usuário nasce ativo; os seguintes nascem INATIVOS (sem acesso)",
);
check(
  (await as("authenticated", EDITOR, "select count(*)::int c from public.projects")).rows[0].c ===
    0,
  "usuário recém-cadastrado (inativo) não lê nem rascunhos",
);
await db.exec(
  `update public.profiles set role='sales', active=true where id='${SALES}'; update public.profiles set active=true where id='${EDITOR}'`,
);
const prof = Object.fromEntries(
  (await q("select id, role from public.profiles")).map((r) => [r.id, r.role]),
);
check(
  prof[ADMIN] === "admin" && prof[EDITOR] === "editor" && prof[SALES] === "sales",
  "primeiro usuário é admin; demais editor (ajustável)",
);

// ───────── escrita: matriz papel × tabela ─────────
await db.exec(`
  insert into public.projects (id,slug,title,status) values ('10000000-0000-0000-0000-000000000001','base-proj','Base','published');
  insert into public.services (id,slug,name,category) values ('20000000-0000-0000-0000-000000000001','base-svc','Base','Motion');
  insert into public.products (id,slug,name) values ('30000000-0000-0000-0000-000000000001','base-prod','Base');
`);
const inserts = {
  categories: `insert into public.categories (slug,name) values ('t-cat','T') returning id`,
  projects: `insert into public.projects (slug,title) values ('t-proj','T') returning id`,
  project_media: `insert into public.project_media (project_id,url) values ('10000000-0000-0000-0000-000000000001','http://x/y.png') returning id`,
  services: `insert into public.services (slug,name,category) values ('t-svc','T','Motion') returning id`,
  service_items: `insert into public.service_items (service_id,title) values ('20000000-0000-0000-0000-000000000001','T') returning id`,
  products: `insert into public.products (slug,name) values ('t-prod','T') returning id`,
  product_media: `insert into public.product_media (product_id,url) values ('30000000-0000-0000-0000-000000000001','http://x/y.png') returning id`,
  banners: `insert into public.banners (key) values ('t-banner') returning id`,
  articles: `insert into public.articles (slug,title) values ('t-art','T') returning id`,
  clients: `insert into public.clients (name) values ('T') returning id`,
  site_settings: `insert into public.site_settings (key,value) values ('t-key','"v"') returning key`,
};
const cleanup = {
  categories: "delete from public.categories where slug='t-cat'",
  projects: "delete from public.projects where slug='t-proj'",
  project_media: "delete from public.project_media where url='http://x/y.png'",
  services: "delete from public.services where slug='t-svc'",
  service_items: "delete from public.service_items where title='T'",
  products: "delete from public.products where slug='t-prod'",
  product_media: "delete from public.product_media where url='http://x/y.png'",
  banners: "delete from public.banners where key='t-banner'",
  articles: "delete from public.articles where slug='t-art'",
  clients: "delete from public.clients where name='T'",
  site_settings: "delete from public.site_settings where key='t-key'",
};
const content = [
  "categories",
  "projects",
  "project_media",
  "services",
  "service_items",
  "products",
  "product_media",
  "banners",
  "articles",
];
const allow = {
  admin: [...content, "clients", "site_settings"],
  editor: content,
  sales: ["clients"],
  anon: [],
};
const actors = {
  admin: ["authenticated", ADMIN],
  editor: ["authenticated", EDITOR],
  sales: ["authenticated", SALES],
  anon: ["anon", null],
};
for (const [who, [role, uid]] of Object.entries(actors)) {
  for (const [table, sql] of Object.entries(inserts)) {
    const r = await as(role, uid, sql);
    const ok = !r.denied && r.rows.length === 1;
    const expected = allow[who].includes(table);
    check(ok === expected, `${who} ${expected ? "pode" : "NÃO pode"} inserir em ${table}`);
    await db.exec(cleanup[table]);
  }
}

// ───────── atualização / exclusão ─────────
const upd = async (who, sql) => (await as(...actors[who], sql)).rows?.length ?? 0;
check(
  (await upd("editor", "update public.site_settings set value='\"x\"' returning key")) === 0,
  "editor não altera configurações",
);
check(
  (await upd("sales", "update public.projects set title='x' returning id")) === 0,
  "comercial não altera projetos",
);
check(
  (await upd("editor", "update public.projects set title='x2' returning id")) === 1,
  "editor altera projetos",
);
check(
  (await upd("editor", "delete from public.projects where slug='base-proj' returning id")) === 1,
  "editor exclui projetos",
);
await db.exec(
  "insert into public.projects (id,slug,title) values ('10000000-0000-0000-0000-0000000000aa','casc','C'); insert into public.project_media (project_id,url) values ('10000000-0000-0000-0000-0000000000aa','http://x/c.png')",
);
await db.exec("delete from public.projects where id='10000000-0000-0000-0000-0000000000aa'");
check(
  (await q("select count(*)::int c from public.project_media where url='http://x/c.png'"))[0].c ===
    0,
  "exclusão de projeto remove mídias em cascata",
);
check(
  (await upd("anon", "delete from public.categories returning id")) === 0,
  "anônimo não exclui nada",
);

// ───────── escalonamento de privilégio ─────────
check(
  (await upd(
    "editor",
    `update public.profiles set role='admin' where id='${EDITOR}' returning id`,
  )) === 0,
  "editor não promove a si mesmo",
);
check(
  (await upd(
    "sales",
    `update public.profiles set active=true, role='admin' where id='${SALES}' returning id`,
  )) === 0,
  "comercial não promove a si mesmo",
);
check(
  (await upd(
    "admin",
    `update public.profiles set role='editor' where id='${EDITOR}' returning id`,
  )) === 1,
  "admin altera papéis",
);
check(
  (await as("authenticated", EDITOR, "select id from public.profiles")).rows.length === 1,
  "usuário comum só enxerga o próprio perfil",
);
await db.exec(`update public.profiles set active=false where id='${SALES}'`);
check(
  (await as("authenticated", SALES, "select count(*)::int c from public.clients")).rows[0].c === 0,
  "usuário desativado perde o acesso",
);
await db.exec(`update public.profiles set active=true where id='${SALES}'`);

// ───────── orçamentos, clientes, histórico ─────────
await db.exec(
  `insert into public.leads (name,whatsapp,email,category,description) values ('Maria','91999999999','m@x.com','Motion','Descrição suficiente')`,
);
const lead = (await q("select id, protocol, status from public.leads"))[0];
check(
  /^ML-\d{6}$/.test(lead.protocol) && lead.status === "novo",
  `protocolo ${lead.protocol} e status inicial "novo"`,
);
check(
  (await q("select count(*)::int c from public.lead_history"))[0].c === 1,
  "histórico criado no insert",
);
check(
  (await upd(
    "sales",
    `update public.leads set status='em_analise', notes='ligar' where id='${lead.id}' returning id`,
  )) === 1,
  "comercial atualiza status e observações",
);
check(
  (await q("select count(*)::int c from public.lead_history"))[0].c === 3,
  "histórico registra status e nota",
);
check(
  (await q(`select author from public.lead_history where action='status'`))[0].author === SALES,
  "histórico guarda o autor da mudança",
);
check(
  (await as("authenticated", SALES, "select * from public.lead_history")).rows.length === 3,
  "comercial lê o histórico",
);
check(
  (await as("authenticated", EDITOR, "select * from public.lead_history")).rows.length === 0,
  "editor não lê histórico",
);
check(
  (await as("authenticated", EDITOR, "select * from public.leads")).rows.length === 0,
  "editor não lê orçamentos",
);
check(
  (await as("anon", null, "select * from public.leads")).rows.length === 0,
  "anônimo não lê orçamentos",
);
check(
  (
    await as(
      "anon",
      null,
      "insert into public.leads (name,whatsapp,email,category,description) values ('xx','91999999999','m@x.com','a','descricao longa ok') returning id",
    )
  ).denied === true,
  "anônimo não insere orçamento direto (só pela API)",
);
check(
  (
    await as(
      "authenticated",
      SALES,
      "insert into public.leads (name,whatsapp,email,category,description) values ('x','1','bad','a','curta') returning id",
    )
  ).denied === true,
  "validações do banco rejeitam dados inválidos",
);
// idempotência: a mesma chave não grava dois orçamentos (reenvio após resposta perdida)
const idem = (name) =>
  `insert into public.leads (name,whatsapp,email,category,description,idempotency_key) values ('${name}','91999999999','i@x.com','Motion','Descrição suficiente','11111111-1111-1111-1111-111111111111')`;
await db.exec(idem("Idem"));
let duplicadoBloqueado = false;
try {
  await db.exec(idem("Idem2"));
} catch {
  duplicadoBloqueado = true;
}
check(duplicadoBloqueado, "mesma chave de idempotência não grava orçamento duplicado");
check(
  (
    await q(
      "select count(*)::int c from public.leads where idempotency_key = '11111111-1111-1111-1111-111111111111'",
    )
  )[0].c === 1,
  "apenas 1 orçamento por chave de idempotência",
);
await db.exec("delete from public.leads where name = 'Idem'");
await db.exec(
  `insert into public.clients (name,email,phone) values ('Maria','m@x.com','91999999999')`,
);
const client = (await q("select id from public.clients where name='Maria'"))[0];
check(
  (await upd(
    "sales",
    `update public.leads set client_id='${client.id}' where id='${lead.id}' returning id`,
  )) === 1,
  "orçamento pode ser vinculado a um cliente",
);
check(
  (await q(`select count(*)::int c from public.leads where client_id='${client.id}'`))[0].c === 1,
  "histórico de orçamentos por cliente",
);
await db.exec(`delete from public.clients where id='${client.id}'`);
check(
  (await q(`select client_id from public.leads where id='${lead.id}'`))[0].client_id === null,
  "excluir cliente preserva o orçamento (set null)",
);

// ───────── privacidade de clientes para editores ─────────
await db.exec(`insert into public.clients (name,email) values ('Cliente Y','y@x.com')`);
check(
  (await as("authenticated", EDITOR, "select * from public.clients")).rows.length === 0,
  "editor NÃO lê clientes (e-mail/telefone)",
);
check(
  (await as("authenticated", EDITOR, "select id,name from public.client_options")).rows.length ===
    1,
  "editor lê só id+nome via client_options",
);
check(
  (await as("anon", null, "select * from public.client_options")).denied === true,
  "anônimo não lê client_options",
);

// ───────── conteúdo público × rascunho ─────────
await db.exec(`insert into public.projects (slug,title,status) values ('pub','Pub','published'),('rasc','Rasc','draft');
  insert into public.services (slug,name,category,active) values ('inativo','I','Motion',false);
  insert into public.products (slug,name,published) values ('oculto','O',false);
  insert into public.articles (slug,title,status) values ('a-rasc','A','draft');
  insert into public.banners (key,active) values ('off',false);`);
const pub = async (sql) => (await as("anon", null, sql)).rows.length;
check(
  (await pub("select 1 from public.projects where slug in ('pub','rasc')")) === 1,
  "anônimo vê só projetos publicados",
);
check(
  (await pub("select 1 from public.services where slug='inativo'")) === 0,
  "serviço inativo é oculto",
);
check(
  (await pub("select 1 from public.products where slug='oculto'")) === 0,
  "produto não publicado é oculto",
);
check(
  (await pub("select 1 from public.articles where slug='a-rasc'")) === 0,
  "artigo em rascunho é oculto",
);
check((await pub("select 1 from public.banners where key='off'")) === 0, "banner inativo é oculto");
check((await pub("select 1 from public.site_settings")) > 0, "configurações públicas são legíveis");
check(
  (await as("authenticated", EDITOR, "select 1 from public.projects where slug='rasc'")).rows
    .length === 1,
  "editor vê rascunhos",
);

// ───────── activity_logs ─────────
check(
  (
    await as(
      "authenticated",
      EDITOR,
      `insert into public.activity_logs (user_id,action,entity) values ('${EDITOR}','update','projects') returning id`,
    )
  ).rows?.length === 1,
  "usuário registra a própria atividade",
);
check(
  (
    await as(
      "authenticated",
      EDITOR,
      `insert into public.activity_logs (user_id,action,entity) values ('${ADMIN}','x','y') returning id`,
    )
  ).denied === true,
  "não é possível registrar atividade em nome de outro usuário",
);
check(
  (await upd("admin", "update public.activity_logs set action='x' returning id")) === 0,
  "log de atividades é imutável (update)",
);
check(
  (await upd("admin", "delete from public.activity_logs returning id")) === 0,
  "log de atividades é imutável (delete)",
);

// ───────── storage ─────────
const bk = Object.fromEntries(
  (await q("select id, file_size_limit, allowed_mime_types from storage.buckets")).map((b) => [
    b.id,
    b,
  ]),
);
check(
  bk.media?.file_size_limit === 52428800 &&
    bk.media.allowed_mime_types.includes("video/mp4") &&
    !bk.media.allowed_mime_types.includes("image/svg+xml"),
  "bucket media: 50 MB, vídeo permitido, SVG proibido",
);
check(
  bk["lead-references"]?.file_size_limit === 4194304 &&
    !bk["lead-references"].allowed_mime_types.includes("image/gif"),
  "bucket lead-references: 4 MB, só imagem/PDF",
);
const obj = (b) =>
  `insert into storage.objects (bucket_id,name) values ('${b}','f.png') returning id`;
check(
  (await as("authenticated", EDITOR, obj("media"))).rows?.length === 1,
  "editor envia para media",
);
check(
  (await as("authenticated", ADMIN, obj("media"))).rows?.length === 1,
  "admin envia para media",
);
check(
  (await as("authenticated", SALES, obj("media"))).denied === true,
  "comercial NÃO envia para media",
);
check((await as("anon", null, obj("media"))).denied === true, "anônimo NÃO envia para media");
check(
  (await as("anon", null, obj("lead-references"))).denied === true,
  "anônimo NÃO grava em lead-references (só a API com service role)",
);
check(
  (await as("anon", null, "select 1 from storage.objects where bucket_id='media'")).rows.length > 0,
  "media é de leitura pública",
);
await db.exec(
  `insert into storage.objects (bucket_id,name) values ('lead-references','l/ref.pdf')`,
);
check(
  (
    await as(
      "authenticated",
      SALES,
      "select 1 from storage.objects where bucket_id='lead-references'",
    )
  ).rows.length === 1,
  "comercial lê anexos de orçamento",
);
check(
  (
    await as(
      "authenticated",
      EDITOR,
      "select 1 from storage.objects where bucket_id='lead-references'",
    )
  ).rows.length === 0,
  "editor NÃO lê anexos de orçamento",
);
check(
  (await as("anon", null, "select 1 from storage.objects where bucket_id='lead-references'")).rows
    .length === 0,
  "anônimo NÃO lê anexos de orçamento",
);
check(
  ((
    await as(
      "authenticated",
      EDITOR,
      "delete from storage.objects where bucket_id='media' returning id",
    )
  ).rows?.length ?? 0) >= 1,
  "editor exclui arquivos de media",
);
check(
  ((
    await as(
      "authenticated",
      SALES,
      "delete from storage.objects where bucket_id='media' returning id",
    )
  ).rows?.length ?? 0) === 0,
  "comercial NÃO exclui arquivos de media",
);

console.log(
  failures === 0 ? "\nMigrações e políticas OK" : `\n${failures} verificação(ões) falharam`,
);
process.exit(failures === 0 ? 0 : 1);
