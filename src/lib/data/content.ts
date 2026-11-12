import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { departments as staticDepartments, type Department } from "@/lib/departments";
import { demoProjects, portfolioCategories, type Media, type Project } from "@/lib/portfolio";
import { productStatusLabels, staticProducts, type Product } from "@/lib/products";
import { site } from "@/lib/site";

export type SiteSettings = {
  instagram: string;
  whatsapp: string;
  email: string;
  companyName: string;
  companyInfo: string;
  seoTitle: string;
  seoDescription: string;
  analyticsId: string;
  logoUrl: string;
  faviconUrl: string;
};

const defaultSettings: SiteSettings = {
  instagram: site.instagram,
  whatsapp: site.whatsapp,
  email: site.email,
  companyName: site.name,
  companyInfo: "",
  seoTitle: `${site.name} — ${site.tagline}`,
  seoDescription:
    "Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.",
  analyticsId: "",
  logoUrl: "",
  faviconUrl: "",
};

const str = (v: unknown, fallback: string) => (typeof v === "string" && v !== "" ? v : fallback);

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const db = createPublicClient();
  if (!db) return defaultSettings;
  const { data, error } = await db.from("site_settings").select("key,value");
  if (error || !data) return defaultSettings;
  const m = Object.fromEntries(data.map((r) => [r.key as string, r.value as unknown]));
  const d = defaultSettings;
  return {
    instagram: str(m.instagram, d.instagram),
    whatsapp: str(m.whatsapp, d.whatsapp),
    email: str(m.email, d.email),
    companyName: str(m.company_name, d.companyName),
    companyInfo: str(m.company_info, d.companyInfo),
    seoTitle: str(m.seo_title, d.seoTitle),
    seoDescription: str(m.seo_description, d.seoDescription),
    analyticsId: str(m.analytics_id, ""),
    logoUrl: str(m.logo_url, ""),
    faviconUrl: str(m.favicon_url, ""),
  };
});

// ───────────── serviços ─────────────
type ServiceRow = {
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  summary: string | null;
  benefits: Department["benefits"] | null;
  faq: Department["faq"] | null;
  service_items: { title: string; sort: number }[];
};

export const getDepartments = cache(async (): Promise<Department[]> => {
  const db = createPublicClient();
  if (!db) return staticDepartments;
  const { data, error } = await db
    .from("services")
    .select("slug,name,category,tagline,summary,benefits,faq,service_items(title,sort)")
    .order("sort");
  if (error || !data?.length) return staticDepartments;
  return (data as unknown as ServiceRow[]).map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    tagline: s.tagline ?? "",
    summary: s.summary ?? "",
    benefits: s.benefits ?? [],
    faq: s.faq ?? [],
    services: [...s.service_items].sort((a, b) => a.sort - b.sort).map((i) => i.title),
  }));
});

export async function getDepartment(slug: string) {
  return (await getDepartments()).find((d) => d.slug === slug);
}

// ───────────── portfólio ─────────────
type ProjectRow = {
  slug: string;
  title: string;
  description: string | null;
  process: string | null;
  result: string | null;
  cover_url: string | null;
  video_url: string | null;
  client_name: string | null;
  show_client: boolean;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  categories: { name: string } | null;
  project_media?: { kind: "image" | "video"; url: string; caption: string | null; sort: number }[];
};

const projectSelect =
  "slug,title,description,process,result,cover_url,video_url,client_name,show_client,featured,seo_title,seo_description,categories(name)";

function mapProject(r: ProjectRow): Project {
  const media: Media[] = [...(r.project_media ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((m) => ({ kind: m.kind, url: m.url, caption: m.caption ?? undefined }));
  return {
    slug: r.slug,
    title: r.title,
    category: r.categories?.name ?? "Design",
    description: r.description ?? "",
    process: r.process ?? "",
    result: r.result ?? "",
    coverUrl: r.cover_url ?? undefined,
    videoUrl: r.video_url ?? undefined,
    clientName: r.show_client && r.client_name ? r.client_name : undefined,
    featured: r.featured,
    seoTitle: r.seo_title ?? undefined,
    seoDescription: r.seo_description ?? undefined,
    media,
    demo: false,
  };
}

export const getProjects = cache(async (): Promise<Project[]> => {
  const db = createPublicClient();
  if (!db) return demoProjects;
  const { data, error } = await db
    .from("projects")
    .select(projectSelect)
    .eq("status", "published")
    .order("sort")
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as ProjectRow[]).map(mapProject);
});

export async function getFeaturedProjects(limit = 3) {
  return (await getProjects()).filter((p) => p.featured && !p.demo).slice(0, limit);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const db = createPublicClient();
  if (!db) return demoProjects.find((p) => p.slug === slug);
  const { data } = await db
    .from("projects")
    .select(`${projectSelect},project_media(kind,url,caption,sort)`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? mapProject(data as unknown as ProjectRow) : undefined;
}

export const getPortfolioCategories = cache(async (): Promise<string[]> => {
  const db = createPublicClient();
  if (!db) return portfolioCategories;
  const { data, error } = await db.from("categories").select("name").order("sort");
  if (error || !data?.length) return portfolioCategories;
  return data.map((c) => c.name as string);
});

// ───────────── produtos ─────────────
type ProductRow = {
  slug: string;
  name: string;
  status: string;
  summary: string | null;
  description: string | null;
  features: string[] | null;
  cover_url: string | null;
  product_media?: { kind: "image" | "video"; url: string; caption: string | null; sort: number }[];
};

const productSelect = "slug,name,status,summary,description,features,cover_url";

function mapProduct(r: ProductRow): Product {
  return {
    slug: r.slug,
    name: r.name,
    status: productStatusLabels[r.status] ?? "Em desenvolvimento",
    summary: r.summary ?? "",
    description: r.description ?? undefined,
    features: r.features ?? [],
    coverUrl: r.cover_url ?? undefined,
    media: [...(r.product_media ?? [])]
      .sort((a, b) => a.sort - b.sort)
      .map((m) => ({ kind: m.kind, url: m.url, caption: m.caption ?? undefined })),
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const db = createPublicClient();
  if (!db) return staticProducts;
  const { data, error } = await db
    .from("products")
    .select(productSelect)
    .eq("published", true)
    .order("sort");
  if (error || !data) return [];
  return (data as unknown as ProductRow[]).map(mapProduct);
});

export async function getProduct(slug: string): Promise<Product | undefined> {
  const db = createPublicClient();
  if (!db) return staticProducts.find((p) => p.slug === slug);
  const { data } = await db
    .from("products")
    .select(`${productSelect},product_media(kind,url,caption,sort)`)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? mapProduct(data as unknown as ProductRow) : undefined;
}

// ───────────── banner ─────────────
export type Banner = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  cta2Label: string;
  cta2Url: string;
  imageUrl?: string;
  videoUrl?: string;
};

const defaultHero: Banner = {
  title: "Ideias que se transformam em experiências.",
  subtitle:
    "Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.",
  ctaLabel: "Solicitar um orçamento",
  ctaUrl: "/contato",
  cta2Label: "Explorar portfólio",
  cta2Url: "/portfolio",
};

export const getHeroBanner = cache(async (): Promise<Banner> => {
  const db = createPublicClient();
  if (!db) return defaultHero;
  const { data } = await db.from("banners").select("*").eq("key", "hero").maybeSingle();
  if (!data) return defaultHero;
  return {
    title: data.title || defaultHero.title,
    subtitle: data.subtitle || defaultHero.subtitle,
    ctaLabel: data.cta_label || defaultHero.ctaLabel,
    ctaUrl: data.cta_url || defaultHero.ctaUrl,
    cta2Label: data.cta2_label || defaultHero.cta2Label,
    cta2Url: data.cta2_url || defaultHero.cta2Url,
    imageUrl: data.image_url || undefined,
    videoUrl: data.video_url || undefined,
  };
});

// ───────────── artigos / páginas ─────────────
export type Article = {
  slug: string;
  title: string;
  kind: "article" | "page";
  excerpt: string;
  body: string;
  coverUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export const getArticles = cache(async (): Promise<Article[]> => {
  const db = createPublicClient();
  if (!db) return [];
  const { data } = await db
    .from("articles")
    .select("slug,title,kind,excerpt,body,cover_url,seo_title,seo_description")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    kind: a.kind,
    excerpt: a.excerpt ?? "",
    body: a.body ?? "",
    coverUrl: a.cover_url ?? undefined,
    seoTitle: a.seo_title ?? undefined,
    seoDescription: a.seo_description ?? undefined,
  }));
});

export async function getArticle(slug: string) {
  return (await getArticles()).find((a) => a.slug === slug);
}
