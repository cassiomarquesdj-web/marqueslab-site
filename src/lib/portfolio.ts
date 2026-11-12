export const portfolioCategories = [
  "Design",
  "Branding",
  "Motion",
  "Audiovisual",
  "LED Visual",
  "Eventos",
  "Marketing",
  "Tecnologia",
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number];

export type Project = {
  slug: string;
  title: string;
  category: PortfolioCategory;
  description: string;
  process: string;
  result: string;
  /** Projetos de demonstração são conceituais e não representam trabalhos reais. */
  demo: boolean;
};

/**
 * Espaços de demonstração. Substitua por projetos reais pelo painel (Sprint 04/05).
 * Nada aqui representa cliente, resultado ou trabalho entregue.
 */
export const projects: Project[] = [
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

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
