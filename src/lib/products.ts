import type { Media } from "./portfolio";

export type ProductStatus =
  "Em desenvolvimento" | "Em testes" | "Disponível" | "Em evolução" | "Experimental";

/** Chaves do enum `product_status` no banco → rótulos exibidos. */
export const productStatusLabels: Record<string, ProductStatus> = {
  em_desenvolvimento: "Em desenvolvimento",
  em_testes: "Em testes",
  disponivel: "Disponível",
  em_evolucao: "Em evolução",
  experimental: "Experimental",
};

export type Product = {
  slug: string;
  name: string;
  status: ProductStatus;
  summary: string;
  description?: string;
  features: string[];
  coverUrl?: string;
  media?: Media[];
};

/** Conteúdo inicial (também gravado no seed). Status refletem o que se sabe hoje. */
export const staticProducts: Product[] = [
  {
    slug: "infinite-studio",
    name: "Marques Lab Infinite Studio",
    status: "Em desenvolvimento",
    summary:
      "Plataforma de criação visual e geração de imagens com mecanismos de prompts e ferramentas criativas.",
    features: ["Geração de imagens", "Mecanismo de prompts", "Ferramentas criativas"],
  },
  {
    slug: "mixer",
    name: "Marques Lab Mixer",
    status: "Em desenvolvimento",
    summary: "Software de mixagem para DJs, com recursos de áudio, vinhetas e efeitos.",
    features: ["Waveform", "Normalização", "Canais de música", "Vinhetas", "Efeitos"],
  },
  {
    slug: "zoeyfest",
    name: "Zoeyfest",
    status: "Em desenvolvimento",
    summary: "Software para gerenciamento de eventos.",
    features: ["Gestão de eventos"],
  },
  {
    slug: "panda-pos",
    name: "Panda POS",
    status: "Em desenvolvimento",
    summary: "Gestão comercial e delivery em módulos integrados.",
    features: ["Vendas", "Caixa", "Financeiro", "Estoque", "Compras", "Custos", "CRM"],
  },
  {
    slug: "autocut",
    name: "AutoCut",
    status: "Em desenvolvimento",
    summary: "Automação e edição de vídeos.",
    features: ["Automação de edição"],
  },
  {
    slug: "localclip",
    name: "LocalClip",
    status: "Em desenvolvimento",
    summary: "Ferramentas para criação e edição de clipes.",
    features: ["Criação de clipes", "Edição"],
  },
];
