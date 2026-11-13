// Carrega o conteúdo inicial (mesmo de supabase/seed.sql) em um projeto Supabase via API.
// Idempotente: não sobrescreve nada que já exista. Uso:
//   node --env-file=.env.local scripts/seed-remote.mts
import { createClient } from "@supabase/supabase-js";
import { departments } from "../src/lib/departments.ts";
import { staticProducts } from "../src/lib/products.ts";
import { portfolioCategories } from "../src/lib/portfolio.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const statusKey: Record<string, string> = {
  "Em desenvolvimento": "em_desenvolvimento",
  "Em testes": "em_testes",
  Disponível: "disponivel",
  "Em evolução": "em_evolucao",
  Experimental: "experimental",
};

const must = <T,>(label: string, r: { error: { message: string } | null; data?: T }) => {
  if (r.error) throw new Error(`${label}: ${r.error.message}`);
  console.log("ok", label);
  return r.data;
};

must(
  "categories",
  await db.from("categories").upsert(
    portfolioCategories.map((name, sort) => ({ slug: slug(name), name, sort })),
    { onConflict: "slug", ignoreDuplicates: true },
  ),
);

must(
  "services",
  await db.from("services").upsert(
    departments.map((d, sort) => ({
      slug: d.slug,
      name: d.name,
      category: d.category,
      tagline: d.tagline,
      summary: d.summary,
      benefits: d.benefits,
      faq: d.faq,
      sort,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  ),
);

const { data: svc } = await db.from("services").select("id,slug");
for (const d of departments) {
  const id = svc?.find((s) => s.slug === d.slug)?.id;
  if (!id) continue;
  const { count } = await db
    .from("service_items")
    .select("*", { count: "exact", head: true })
    .eq("service_id", id);
  if (count) continue;
  must(
    `service_items ${d.slug}`,
    await db
      .from("service_items")
      .insert(d.services.map((title, sort) => ({ service_id: id, title, sort }))),
  );
}

must(
  "products",
  await db.from("products").upsert(
    staticProducts.map((p, sort) => ({
      slug: p.slug,
      name: p.name,
      status: statusKey[p.status],
      summary: p.summary,
      features: p.features,
      sort,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  ),
);

must(
  "banner hero",
  await db.from("banners").upsert(
    {
      key: "hero",
      title: "Ideias que se transformam em experiências.",
      subtitle:
        "Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.",
      cta_label: "Solicitar um orçamento",
      cta_url: "/contato",
      cta2_label: "Explorar portfólio",
      cta2_url: "/portfolio",
    },
    { onConflict: "key", ignoreDuplicates: true },
  ),
);

const settings: Record<string, string> = {
  instagram: "https://instagram.com/_marqueslab",
  whatsapp: "",
  email: "",
  company_name: "Marques Lab",
  company_info: "",
  seo_title: "Marques Lab — Laboratório de Impacto Visual",
  seo_description:
    "Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.",
  analytics_id: "",
  logo_url: "",
  favicon_url: "",
};
must(
  "site_settings",
  await db.from("site_settings").upsert(
    Object.entries(settings).map(([k, value]) => ({ key: k, value })),
    { onConflict: "key", ignoreDuplicates: true },
  ),
);

for (const t of [
  "categories",
  "services",
  "service_items",
  "products",
  "banners",
  "site_settings",
]) {
  const { count } = await db.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${count} linhas`);
}
