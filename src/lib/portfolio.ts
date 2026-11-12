export const portfolioCategories = [
  "Design",
  "Branding",
  "Motion",
  "Audiovisual",
  "LED Visual",
  "Eventos",
  "Marketing",
  "Tecnologia",
];

export type Media = { kind: "image" | "video"; url: string; caption?: string };

export type Project = {
  slug: string;
  title: string;
  category: string;
  description: string;
  process: string;
  result: string;
  coverUrl?: string;
  videoUrl?: string;
  clientName?: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  media?: Media[];
  /** Projetos de demonstração são conceituais e não representam trabalhos reais. */
  demo: boolean;
};

/**
 * Espaços de demonstração, usados apenas quando o Supabase não está configurado.
 * Nada aqui representa cliente, resultado ou trabalho entregue.
 */
export const demoProjects: Project[] = [
  {
    slug: "demo-identidade-visual",
    title: "Espaço para identidade visual",
    category: "Branding",
    description:
      "Área reservada para apresentar um projeto de identidade visual: logotipo, aplicações e manual de marca.",
    process: "Descreva aqui o processo criativo do projeto.",
    result: "Descreva aqui o resultado, quando houver autorização.",
    demo: true,
  },
  {
    slug: "demo-motion",
    title: "Espaço para motion design",
    category: "Motion",
    description: "Área reservada para uma abertura, vinheta ou animação de marca.",
    process: "Descreva aqui o processo criativo do projeto.",
    result: "Descreva aqui o resultado, quando houver autorização.",
    demo: true,
  },
  {
    slug: "demo-led-visual",
    title: "Espaço para conteúdo LED",
    category: "LED Visual",
    description: "Área reservada para loops de painel, visualizers e conteúdo para palco.",
    process: "Descreva aqui o processo criativo do projeto.",
    result: "Descreva aqui o resultado, quando houver autorização.",
    demo: true,
  },
  {
    slug: "demo-evento",
    title: "Espaço para campanha de evento",
    category: "Eventos",
    description: "Área reservada para identidade, divulgação e materiais de um evento.",
    process: "Descreva aqui o processo criativo do projeto.",
    result: "Descreva aqui o resultado, quando houver autorização.",
    demo: true,
  },
];
