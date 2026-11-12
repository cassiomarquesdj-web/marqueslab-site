import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getArticle, getArticles } from "@/lib/data/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt,
    alternates: { canonical: `/artigos/${a.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  // O corpo é texto simples: parágrafos separados por linha em branco. Nenhum HTML é interpretado.
  const paragraphs = a.body.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      <PageHero
        eyebrow={a.kind === "page" ? "Institucional" : "Artigo"}
        title={a.title}
        text={a.excerpt}
      />
      <Section>
        <div className="text-steel max-w-3xl space-y-6 text-lg">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </Section>
    </>
  );
}
