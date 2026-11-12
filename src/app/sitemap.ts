import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getArticles, getDepartments, getProducts, getProjects } from "@/lib/data/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [departments, products, projects, articles] = await Promise.all([
    getDepartments(),
    getProducts(),
    getProjects(),
    getArticles(),
  ]);
  const paths = [
    "",
    "/servicos",
    "/portfolio",
    "/sobre",
    "/tecnologia",
    "/contato",
    "/artigos",
    ...departments.map((d) => `/servicos/${d.slug}`),
    ...products.map((p) => `/tecnologia/${p.slug}`),
    ...projects.filter((p) => !p.demo).map((p) => `/portfolio/${p.slug}`),
    ...articles.map((a) => `/artigos/${a.slug}`),
  ];
  return paths.map((p) => ({ url: `${site.url}${p}` }));
}
