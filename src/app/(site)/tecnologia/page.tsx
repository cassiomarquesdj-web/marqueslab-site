import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { Reveal } from "@/components/animations/Reveal";
import { getProducts } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Tecnologia",
  description:
    "Marques Lab Innovation: produtos e projetos próprios de software, automação e criação com IA.",
  alternates: { canonical: "/tecnologia" },
};

export default async function TecnologiaPage() {
  const products = await getProducts();
  return (
    <>
      <PageHero
        eyebrow="Marques Lab Innovation"
        title="O laboratório de inovação."
        text="Produtos e projetos desenvolvidos pelo Marques Lab. Cada um mostra o status real: nada aqui é apresentado como lançado antes da hora."
      />
      <Section>
        <ul className="border-t border-white/10">
          {products.map((p, i) => (
            <li key={p.slug}>
              <Reveal>
                <Link
                  href={`/tecnologia/${p.slug}`}
                  className="group grid gap-3 border-b border-white/10 py-9 transition-colors hover:bg-white/[0.02] md:grid-cols-[3rem_1.2fr_1.5fr_auto] md:items-baseline"
                >
                  <span className="text-steel group-hover:text-flame font-mono text-xs">
                    0{i + 1}
                  </span>
                  <h2 className="font-display text-2xl font-bold uppercase">{p.name}</h2>
                  <p className="text-steel">{p.summary}</p>
                  <span className="border-flame/50 text-flame-soft w-fit border px-3 py-1 font-mono text-[10px] tracking-widest uppercase">
                    {p.status}
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBand title="Precisa de uma solução digital sob medida?" category="Tecnologia" />
    </>
  );
}
