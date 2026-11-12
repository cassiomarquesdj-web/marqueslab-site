import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Cover } from "@/components/ui/Cover";
import { getProduct, getProducts } from "@/lib/data/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/tecnologia/${p.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();

  return (
    <>
      <PageHero eyebrow={`Status: ${p.status}`} title={p.name} text={p.summary}>
        <Button href="/tecnologia" variant="ghost">
          Todos os projetos
        </Button>
      </PageHero>
      {p.description && (
        <Section label="Sobre o projeto">
          <p className="text-steel max-w-3xl text-lg whitespace-pre-line">{p.description}</p>
        </Section>
      )}
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
        <Cover url={p.coverUrl} label={p.name} demo={!p.coverUrl} className="aspect-[21/9]" />
        {p.media && p.media.length > 0 && (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            {p.media.map((m) => (
              <li key={m.url}>
                {m.kind === "video" ? (
                  <video
                    controls
                    preload="none"
                    playsInline
                    src={m.url}
                    className="w-full bg-black"
                  />
                ) : (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={m.url}
                      alt={m.caption ?? p.name}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                {m.caption && <p className="text-steel mt-2 text-sm">{m.caption}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="text-steel mt-6 max-w-2xl">
          Status atual: <strong className="text-white">{p.status.toLowerCase()}</strong>.
        </p>
      </Section>
    </>
  );
}
