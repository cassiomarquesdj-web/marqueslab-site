import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { Reveal } from "@/components/animations/Reveal";
import { departments } from "@/lib/departments";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Design, motion, audiovisual, LED visual, eventos, marketing e tecnologia: os sete departamentos do Marques Lab.",
  alternates: { canonical: "/servicos" },
};

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Serviços"
        title="Um laboratório, sete departamentos."
        text="Do conceito à execução final, cada departamento cuida de uma parte do projeto para que tudo chegue ao público com a mesma identidade."
      />
      <Section>
        <ol className="border-t border-white/10">
          {departments.map((d, i) => (
            <li key={d.slug}>
              <Reveal>
                <Link
                  href={`/servicos/${d.slug}`}
                  className="group grid gap-3 border-b border-white/10 py-9 transition-colors hover:bg-white/[0.02] md:grid-cols-[6rem_1fr_1.2fr_auto] md:items-baseline"
                >
                  <span className="text-steel group-hover:text-flame font-mono text-xs tracking-widest">
                    DEP. 0{i + 1}
                  </span>
                  <h2 className="font-display text-2xl font-bold uppercase">{d.name}</h2>
                  <p className="text-steel">{d.summary}</p>
                  <span className="text-flame font-mono text-xs tracking-widest uppercase">
                    Ver mais →
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>
      <CtaBand />
    </>
  );
}
