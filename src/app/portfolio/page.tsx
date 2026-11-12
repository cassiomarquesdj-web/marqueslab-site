import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { projects } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Portfólio",
  description:
    "Projetos de design, branding, motion, audiovisual, LED visual, eventos e tecnologia.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="Impacto visual em projetos."
        text="Uma seleção de trabalhos do laboratório. Os espaços marcados como demonstração serão substituídos por projetos reais."
      />
      <Section>
        <PortfolioGrid projects={projects} />
      </Section>
      <CtaBand title="Seu próximo projeto merece mais do que o comum." />
    </>
  );
}
