import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { getArticles } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Artigos",
  description: "Conteúdo do Marques Lab sobre design, audiovisual e tecnologia.",
  alternates: { canonical: "/artigos" },
};

export default async function ArtigosPage() {
  const articles = (await getArticles()).filter((a) => a.kind === "article");
  return (
    <>
      <PageHero eyebrow="Artigos" title="Ideias do laboratório." />
      <Section>
        {articles.length === 0 ? (
          <p className="text-steel border border-dashed border-white/15 p-10">
            Nenhum artigo publicado ainda.
          </p>
        ) : (
          <ul className="border-t border-white/10">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/artigos/${a.slug}`}
                  className="group block border-b border-white/10 py-8 hover:bg-white/[0.02]"
                >
                  <h2 className="font-display group-hover:text-flame-soft text-2xl font-bold uppercase">
                    {a.title}
                  </h2>
                  <p className="text-steel mt-2">{a.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
