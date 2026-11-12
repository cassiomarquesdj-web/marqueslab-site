import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { ConceptCover } from "@/components/ui/ConceptCover";
import { getProject, projects } from "@/lib/portfolio";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/portfolio/${p.slug}` },
  };
}

export default async function ProjectPage({ params }: Props) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const related = projects.filter((r) => r.category === p.category && r.slug !== p.slug);
  const others = related.length ? related : projects.filter((r) => r.slug !== p.slug).slice(0, 2);

  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} text={p.description} />
      <Section>
        <ConceptCover label={p.category} demo={p.demo} className="aspect-[21/9]" />
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Processo criativo
            </h2>
            <p className="text-steel mt-4">{p.process}</p>
          </div>
          <div>
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">Resultado</h2>
            <p className="text-steel mt-4">{p.result}</p>
          </div>
        </div>
      </Section>
      <Section label="Relacionados" title="Outros projetos" tone="raised">
        <ul className="grid gap-6 sm:grid-cols-2">
          {others.map((r) => (
            <li key={r.slug}>
              <Link href={`/portfolio/${r.slug}`} className="group block">
                <ConceptCover label={r.category} demo={r.demo} />
                <h3 className="font-display group-hover:text-flame-soft mt-3 font-bold uppercase">
                  {r.title}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBand />
    </>
  );
}
