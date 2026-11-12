import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { departments } from "@/lib/departments";
import { products } from "@/lib/products";
import { projects } from "@/lib/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/servicos",
    "/portfolio",
    "/sobre",
    "/tecnologia",
    "/contato",
    ...departments.map((d) => `/servicos/${d.slug}`),
    ...products.map((p) => `/tecnologia/${p.slug}`),
    ...projects.filter((p) => !p.demo).map((p) => `/portfolio/${p.slug}`),
  ];
  return paths.map((p) => ({ url: `${site.url}${p}` }));
}
