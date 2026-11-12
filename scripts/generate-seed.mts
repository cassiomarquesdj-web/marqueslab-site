// Gera supabase/seed.sql a partir do conteúdo estático do site.
import { writeFileSync } from "node:fs";
import { departments } from "../src/lib/departments.ts";
import { staticProducts as products } from "../src/lib/products.ts";
import { portfolioCategories } from "../src/lib/portfolio.ts";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
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

const out: string[] = ["-- Gerado por scripts/generate-seed.mts. Idempotente."];

portfolioCategories.forEach((c, i) =>
  out.push(
    `insert into public.categories (slug,name,sort) values (${q(slug(c))},${q(c)},${i}) on conflict (slug) do nothing;`,
  ),
);

departments.forEach((d, i) => {
  out.push(
    `insert into public.services (slug,name,category,tagline,summary,benefits,faq,sort) values (${q(d.slug)},${q(d.name)},${q(d.category)},${q(d.tagline)},${q(d.summary)},${j(d.benefits)},${j(d.faq)},${i}) on conflict (slug) do nothing;`,
  );
  d.services.forEach((s, n) =>
    out.push(
      `insert into public.service_items (service_id,title,sort) select id,${q(s)},${n} from public.services where slug=${q(d.slug)} and not exists (select 1 from public.service_items si where si.service_id=services.id and si.title=${q(s)});`,
    ),
  );
});

products.forEach((p, i) =>
  out.push(
    `insert into public.products (slug,name,status,summary,features,sort) values (${q(p.slug)},${q(p.name)},${q(statusKey[p.status])},${q(p.summary)},array[${p.features.map(q).join(",")}],${i}) on conflict (slug) do nothing;`,
  ),
);

out.push(
  `insert into public.banners (key,title,subtitle,cta_label,cta_url,cta2_label,cta2_url) values ('hero','Ideias que se transformam em experiências.','Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.','Solicitar um orçamento','/contato','Explorar portfólio','/portfolio') on conflict (key) do nothing;`,
);
for (const [k, v] of Object.entries({
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
}))
  out.push(
    `insert into public.site_settings (key,value) values (${q(k)},${j(v)}) on conflict (key) do nothing;`,
  );

writeFileSync("supabase/seed.sql", out.join("\n") + "\n");
console.log("seed.sql:", out.length, "comandos");
