import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { Faq } from "@/components/ui/Faq";
import { ConceptCover } from "@/components/ui/ConceptCover";
import { departments, getDepartment, sharedFaq } from "@/lib/departments";
import { projects } from "@/lib/portfolio";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return departments.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDepartment((await params).slug);
  if (!d) return {};
  return {
    title: d.name,
    description: d.tagline,
    alternates: { canonical: `/servicos/${d.slug}` },
  };
}

export default async function DepartmentPage({ params }: Props) {
  const d = getDepartment((await params).slug);
  if (!d) notFound();
  const related = projects.filter((p) => p.category === d.category);

  return (
    <>
      <PageHero eyebrow="Departamento" title={d.name} text={d.tagline}>
        <Button href={`/contato?servico=${encodeURIComponent(d.category)}`}>
          Solicitar um orçamento
        </Button>
        <Button href="/servicos" variant="ghost">
          Todos os serviços
        </Button>
      </PageHero>

      <Section label="O que fazemos" title="Serviços oferecidos" tone="raised">
        <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {d.services.map((s) => (
            <li key={s} className="flex gap-3 border-b border-white/10 py-4">
              <span className="text-flame font-mono">/</span>
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Benefícios" title="Por que este departamento">
        <div className="grid gap-10 md:grid-cols-3">
          {d.benefits.map((b) => (
            <div key={b.title} className="border-flame border-l-2 pl-5">
              <h3 className="font-display text-xl font-bold uppercase">{b.title}</h3>
              <p className="text-steel mt-2">{b.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Projetos" title="Galeria" tone="raised">
        {related.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link href={`/portfolio/${p.slug}`} className="group block">
                  <ConceptCover label={p.category} demo={p.demo} />
                  <h3 className="font-display group-hover:text-flame-soft mt-3 font-bold uppercase">
                    {p.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-steel">Os projetos deste departamento serão publicados em breve.</p>
        )}
      </Section>

      <Section label="Processo" title="Como trabalhamos">
        <ProcessSteps />
      </Section>

      <Section label="Dúvidas" title="Perguntas frequentes" tone="raised">
        <Faq items={[...d.faq, ...sharedFaq]} />
      </Section>

      <CtaBand category={d.category} />
    </>
  );
}
