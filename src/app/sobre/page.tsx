import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { ProcessSteps } from "@/components/ui/ProcessSteps";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "O Marques Lab é um laboratório criativo que conecta design, tecnologia, audiovisual e produção.",
  alternates: { canonical: "/sobre" },
};

const values = [
  ["Criatividade com propósito", "Cada decisão visual existe para comunicar."],
  [
    "Tecnologia como aliada",
    "Usamos ferramentas modernas para ampliar o que a criação consegue fazer.",
  ],
  ["Execução", "Da ideia à entrega final, o projeto sai do papel."],
  ["Transparência", "Prazos, escopo e status sempre claros para o cliente."],
];

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre"
        title="Um laboratório onde criatividade, tecnologia e produção se encontram."
      />

      <Section label="Conceito" tone="raised">
        <div className="grid gap-12 lg:grid-cols-2">
          <p className="font-display text-3xl leading-tight font-medium">
            O Marques Lab é um laboratório criativo que conecta design, tecnologia, audiovisual e
            produção para desenvolver soluções visuais e digitais.
          </p>
          <p className="text-steel text-lg">
            Não somos apenas flyers, vídeos ou artes gráficas. Somos um estúdio multidisciplinar que
            atende empresas, marcas, artistas, produtores de eventos, empreendedores e
            estabelecimentos comerciais, transformando ideias em projetos visuais, experiências e
            soluções tecnológicas.
          </p>
        </div>
      </Section>

      <Section label="Direção" title="Missão e visão">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="border-flame border-l-2 pl-5">
            <h3 className="font-display text-xl font-bold uppercase">Missão</h3>
            <p className="text-steel mt-2">
              Transformar ideias em projetos que comunicam, impressionam e geram valor.
            </p>
          </div>
          <div className="border-flame border-l-2 pl-5">
            <h3 className="font-display text-xl font-bold uppercase">Visão</h3>
            <p className="text-steel mt-2">
              Ser reconhecido como um estúdio criativo que une impacto visual e inovação
              tecnológica.
            </p>
          </div>
        </div>
      </Section>

      <Section label="Valores" tone="raised">
        <ul className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
          {values.map(([t, d]) => (
            <li key={t} className="bg-ink-2 p-8">
              <h3 className="font-display text-xl font-bold uppercase">{t}</h3>
              <p className="text-steel mt-2">{d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Metodologia" title="Como trabalhamos">
        <ProcessSteps />
      </Section>

      <CtaBand title="Criatividade, tecnologia e execução em um só lugar." />
    </>
  );
}
