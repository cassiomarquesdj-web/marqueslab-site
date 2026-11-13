// Varredura de arquivos ÓRFÃOS no Supabase Storage (enviados e nunca vinculados a nenhum registro).
//
//   node --env-file=.env.local scripts/cleanup-orphans.mjs              # só lista (simulação)
//   node --env-file=.env.local scripts/cleanup-orphans.mjs --apply      # apaga
//   node --env-file=.env.local scripts/cleanup-orphans.mjs --min-age-hours=1
//
// Por que existem órfãos: o painel envia mídia direto ao Storage ANTES de salvar o registro; se o
// usuário abandona a página, esse arquivo fica sem dono. O painel já descarta o que é trocado/removido
// na mesma edição; esta varredura pega o resto. Só apaga arquivos mais antigos que --min-age-hours
// (padrão 24 h) para não tocar em uploads de edições em andamento.
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const minAgeHours = Number(args.find((a) => a.startsWith("--min-age-hours="))?.split("=")[1] ?? 24);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Lista todos os arquivos de um bucket (até 2 níveis de pasta). */
async function listAll(bucket) {
  const out = [];
  const { data: top } = await db.storage.from(bucket).list("", { limit: 1000 });
  for (const entry of top ?? []) {
    if (entry.id) out.push({ path: entry.name, created: entry.created_at });
    else {
      const { data: inner } = await db.storage.from(bucket).list(entry.name, { limit: 1000 });
      for (const f of inner ?? [])
        if (f.id) out.push({ path: `${entry.name}/${f.name}`, created: f.created_at });
    }
  }
  return out;
}

const old = (iso) => !iso || Date.now() - new Date(iso).getTime() > minAgeHours * 3600 * 1000;

// ── bucket "media": referenciado por URL pública em várias tabelas
const mediaPrefix = `${url.replace(/\/$/, "")}/storage/v1/object/public/media/`;
const refs = new Set();
const columns = [
  ["projects", "cover_url"],
  ["project_media", "url"],
  ["services", "banner_url"],
  ["products", "cover_url"],
  ["product_media", "url"],
  ["banners", "image_url"],
  ["articles", "cover_url"],
];
for (const [table, col] of columns) {
  const { data } = await db.from(table).select(col);
  for (const r of data ?? []) if (r[col]) refs.add(r[col]);
}
const { data: settings } = await db.from("site_settings").select("value");
for (const r of settings ?? []) if (typeof r.value === "string") refs.add(r.value);
const usedMedia = new Set(
  [...refs]
    .filter((u) => u.startsWith(mediaPrefix))
    .map((u) => decodeURIComponent(u.slice(mediaPrefix.length))),
);

// ── bucket "lead-references": referenciado por leads.attachments[].path
const { data: leads } = await db.from("leads").select("attachments");
const usedLeadFiles = new Set(
  (leads ?? []).flatMap((l) => (l.attachments ?? []).map((a) => a.path)),
);

const orphans = [];
for (const f of await listAll("media"))
  if (!usedMedia.has(f.path) && old(f.created)) orphans.push({ bucket: "media", ...f });
for (const f of await listAll("lead-references"))
  if (!usedLeadFiles.has(f.path) && old(f.created))
    orphans.push({ bucket: "lead-references", ...f });

console.log(`${orphans.length} arquivo(s) órfão(s) com mais de ${minAgeHours} h`);
for (const o of orphans) console.log(` - ${o.bucket}/${o.path}`);

if (apply && orphans.length) {
  for (const bucket of ["media", "lead-references"]) {
    const paths = orphans.filter((o) => o.bucket === bucket).map((o) => o.path);
    if (paths.length) {
      const { error } = await db.storage.from(bucket).remove(paths);
      console.log(
        error ? `erro em ${bucket}: ${error.message}` : `removidos de ${bucket}: ${paths.length}`,
      );
    }
  }
} else if (orphans.length) {
  console.log("(simulação: rode com --apply para apagar)");
}
