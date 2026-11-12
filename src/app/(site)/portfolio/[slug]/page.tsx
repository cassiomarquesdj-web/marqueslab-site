import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { CtaBand } from "@/components/ui/CtaBand";
import { Cover } from "@/components/ui/Cover";
import { getProject, getProjects } from "@/lib/data/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return {
    title: p.seoTitle ?? p.title,
    description: p.seoDescription ?? p.description,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: p.coverUrl ? { images: [p.coverUrl] } : undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const all = await getProjects();
  const related = all.filter((r) => r.category === p.category && r.slug !== p.slug);
  const others = (related.length ? related : all.filter((r) => r.slug !== p.slug)).slice(0, 2);

  return (
    <>
      <PageHero
        eyebrow={p.clientName ? `${p.category} — ${p.clientName}` : p.category}
        title={p.title}
        text={p.description}
      />
      <Section>
        <Cover
          url={p.coverUrl}
          label={p.category}
          alt={p.title}
          demo={p.demo}
          className="aspect-[21/9]"
        />
        {p.videoUrl && (
          <video
            controls
            preload="none"
            playsInline
            src={p.videoUrl}
            className="mt-6 w-full bg-black"
          />
        )}
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
                      alt={m.caption ?? p.title}
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
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Processo criativo
            </h2>
            <p className="text-steel mt-4 whitespace-pre-line">{p.process}</p>
          </div>
          <div>
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">Resultado</h2>
            <p className="text-steel mt-4 whitespace-pre-line">{p.result}</p>
          </div>
        </div>
      </Section>
      {others.length > 0 && (
        <Section label="Relacionados" title="Outros projetos" tone="raised">
          <ul className="grid gap-6 sm:grid-cols-2">
            {others.map((r) => (
              <li key={r.slug}>
                <Link href={`/portfolio/${r.slug}`} className="group block">
                  <Cover url={r.coverUrl} label={r.category} alt={r.title} demo={r.demo} />
                  <h3 className="font-display group-hover:text-flame-soft mt-3 font-bold uppercase">
                    {r.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <CtaBand />
    </>
  );
}
