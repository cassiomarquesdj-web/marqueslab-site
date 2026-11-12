import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { getPortfolioCategories, getProjects } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Portfólio",
  description:
    "Projetos de design, branding, motion, audiovisual, LED visual, eventos e tecnologia.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [projects, categories] = await Promise.all([getProjects(), getPortfolioCategories()]);
  const demo = projects.some((p) => p.demo);
  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="Impacto visual em projetos."
        text={
          demo
            ? "Os espaços marcados como demonstração serão substituídos por projetos reais cadastrados pelo painel."
            : "Uma seleção de trabalhos do laboratório."
        }
      />
      <Section>
        <PortfolioGrid projects={projects} categories={categories} />
      </Section>
      <CtaBand title="Seu próximo projeto merece mais do que o comum." />
    </>
  );
}
