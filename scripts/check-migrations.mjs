// Valida as migrações em um Postgres em memória (PGlite), com stubs do Supabase.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema public, auth to anon, authenticated;
`);

for (const f of readdirSync("supabase/migrations").sort()) {
  await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  console.log("ok", f);
}
if (existsSync("supabase/seed.sql")) {
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  console.log("ok seed.sql");
}
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;`);

const as = async (role, uid, sql) => {
  await db.exec(`set role ${role}; select set_config('request.uid', '${uid ?? ""}', false);`);
  try {
    return (await db.query(sql)).rows;
  } finally {
    await db.exec("reset role");
  }
};
const q = async (sql) => (await db.query(sql)).rows;
const expect = (c, m) => {
  if (!c) {
    console.error("FALHOU:", m);
    process.exit(1);
  }
  console.log("✓", m);
};

// primeiro usuário vira admin, segundo vira editor
await db
  .exec(
    `insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-000000000001','a@x.com'),
 ('00000000-0000-0000-0000-000000000002','b@x.com');
 insert into public.profiles (id, role) select id, 'sales' from auth.users where false;`,
  )
  .catch(() => {});
const roles = await q("select id, role from public.profiles order by id");
expect(
  roles[0].role === "admin" && roles[1].role === "editor",
  "primeiro usuário admin, segundo editor",
);

await db.exec(`insert into public.projects (slug,title,status) values ('p-pub','Pub','published'),('p-draft','Rascunho','draft');
 insert into public.leads (name,whatsapp,email,category,description) values ('Maria','91999999999','m@x.com','Motion','Descrição suficiente');`);
const lead = (await q("select protocol from public.leads"))[0];
expect(/^ML-\d{6}$/.test(lead.protocol), "protocolo gerado " + lead.protocol);
expect(
  (await q("select count(*)::int c from public.lead_history"))[0].c === 1,
  "histórico criado no insert",
);
await db.exec("update public.leads set status='em_analise', notes='ligar amanhã'");
expect(
  (await q("select count(*)::int c from public.lead_history"))[0].c === 3,
  "histórico de status e nota",
);

expect(
  (await as("anon", null, "select slug from public.projects")).length === 1,
  "anônimo vê só publicados",
);
expect(
  (await as("anon", null, "select * from public.leads")).length === 0,
  "anônimo não vê orçamentos",
);
expect(
  (await as("authenticated", "00000000-0000-0000-0000-000000000002", "select * from public.leads"))
    .length === 0,
  "editor não vê orçamentos",
);
expect(
  (
    await as(
      "authenticated",
      "00000000-0000-0000-0000-000000000002",
      "select slug from public.projects",
    )
  ).length === 2,
  "editor vê rascunhos",
);
expect(
  (await as("authenticated", "00000000-0000-0000-0000-000000000001", "select * from public.leads"))
    .length === 1,
  "admin vê orçamentos",
);
let blocked = false;
try {
  await as(
    "anon",
    null,
    "insert into public.leads (name,whatsapp,email,category,description) values ('x1','91999999999','m@x.com','a','descricao longa ok')",
  );
} catch {
  blocked = true;
}
expect(blocked, "anônimo não insere orçamento direto");
console.log("Migrações e políticas OK");
