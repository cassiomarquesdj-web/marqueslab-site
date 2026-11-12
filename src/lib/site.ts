export const site = {
  name: "Marques Lab",
  tagline: "Laboratório de Impacto Visual",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://marqueslab.com.br",
  instagram: "https://instagram.com/_marqueslab",
  instagramHandle: "@_marqueslab",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

export const nav = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/tecnologia", label: "Tecnologia" },
  { href: "/contato", label: "Contato" },
] as const;
