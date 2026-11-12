export const site = {
  name: "Marques Lab",
  tagline: "Laboratório de Impacto Visual",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://marqueslab.com.br",
  instagram: "https://instagram.com/_marqueslab",
  instagramHandle: "@_marqueslab",
  // Padrão: número que já constava no site antigo (legacy/index.html). Configurável no painel.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5591991805102",
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
