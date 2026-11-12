import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { ConceptCover } from "@/components/ui/ConceptCover";
import { getProduct, products } from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/tecnologia/${p.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();

  return (
    <>
      <PageHero eyebrow={`Status: ${p.status}`} title={p.name} text={p.summary}>
        <Button href="/tecnologia" variant="ghost">
          Todos os projetos
        </Button>
      </PageHero>
      <Section label="Funcionalidades" tone="raised">
        <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {p.features.map((f) => (
            <li key={f} className="flex gap-3 border-b border-white/10 py-4">
              <span className="text-flame font-mono">/</span>
              {f}
            </li>
          ))}
        </ul>
      </Section>
      <Section label="Mídia" title="Imagens e demonstrações">
        <ConceptCover label={p.name} className="aspect-[21/9]" />
        <p className="text-steel mt-6 max-w-2xl">
          Capturas de tela e demonstrações serão adicionadas conforme o projeto evolui. Atualmente o
          status é <strong className="text-white">{p.status.toLowerCase()}</strong>.
        </p>
      </Section>
    </>
  );
}
