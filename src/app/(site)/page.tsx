import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Cover } from "@/components/ui/Cover";
import { Hero3D } from "@/components/hero/Hero3D";
import { Reveal } from "@/components/animations/Reveal";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import {
  getDepartments,
  getFeaturedProjects,
  getHeroBanner,
  getProducts,
} from "@/lib/data/content";

export default async function Home() {
  const [hero, departments, featured, products] = await Promise.all([
    getHeroBanner(),
    getDepartments(),
    getFeaturedProjects(),
    getProducts(),
  ]);

  return (
    <>
      <section className="relative flex min-h-svh items-end overflow-hidden px-4 pb-20 sm:px-8">
        <Hero3D />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <p className="text-flame mb-6 font-mono text-xs tracking-[0.25em] uppercase">
            Marques Lab — Laboratório de impacto visual
          </p>
          <h1 className="font-display max-w-4xl text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.95] font-bold uppercase">
            {hero.title}
          </h1>
          <p className="text-steel mt-8 max-w-xl text-lg">{hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href={hero.ctaUrl}>{hero.ctaLabel}</Button>
            <Button href={hero.cta2Url} variant="ghost">
              {hero.cta2Label}
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-28 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              01 / O laboratório
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-3xl leading-tight font-medium sm:text-4xl">
              O Marques Lab é um laboratório criativo que conecta design, tecnologia, audiovisual e
              produção para desenvolver soluções visuais e digitais.
            </p>
            <p className="text-steel mt-8 max-w-2xl text-lg">
              Da primeira ideia à execução final, trabalhamos para transformar conceitos em projetos
              que comunicam, impressionam e geram valor.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink-2 px-4 py-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              02 / Departamentos
            </p>
            <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold uppercase sm:text-5xl">
              Criatividade, tecnologia e execução em um só lugar.
            </h2>
          </Reveal>
          <ol className="mt-16 border-t border-white/10">
            {departments.map((d, i) => (
              <li key={d.slug}>
                <Reveal delay={i * 0.04}>
                  <Link
                    href={`/servicos/${d.slug}`}
                    className="group grid gap-3 border-b border-white/10 py-8 transition-colors hover:bg-white/[0.02] md:grid-cols-[6rem_1fr_1.2fr] md:items-baseline"
                  >
                    <span className="text-steel group-hover:text-flame font-mono text-xs tracking-widest transition-colors">
                      DEP. 0{i + 1}
                    </span>
                    <h3 className="font-display text-2xl font-bold uppercase">{d.name}</h3>
                    <p className="text-steel">{d.summary}</p>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-4 py-28 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
                03 / Projetos em destaque
              </p>
            </Reveal>
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {featured.map((p) => (
                <li key={p.slug}>
                  <Link href={`/portfolio/${p.slug}`} className="group block">
                    <Cover url={p.coverUrl} label={p.category} alt={p.title} />
                    <h3 className="font-display group-hover:text-flame-soft mt-4 text-xl font-bold uppercase">
                      {p.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="px-4 py-28 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Experiências audiovisuais
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold uppercase sm:text-5xl">
              Palcos e telas que viram experiência.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-steel text-lg">
              Loops para painéis LED, conteúdo para VJ, aberturas cinematográficas, vídeos de
              divulgação e captação de eventos: da criação à finalização, tudo no mesmo laboratório.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/servicos/led-visual-experiencias" variant="ghost">
                LED Visual & Experiências
              </Button>
              <Button href="/servicos/audiovisual-producao" variant="ghost">
                Audiovisual & Produção
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink-2 px-4 py-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">Diferenciais</p>
          </Reveal>
          <dl className="mt-12 grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Estúdio multidisciplinar",
                "Design, motion, vídeo, eventos, marketing e tecnologia sob a mesma direção.",
              ],
              ["Da ideia à entrega", "Criamos e finalizamos: o material chega pronto para uso."],
              [
                "Tecnologia própria",
                "Também desenvolvemos software e ferramentas para produção criativa.",
              ],
              ["Qualquer porte", "De eventos populares a grandes produções."],
            ].map(([t, d]) => (
              <div key={t} className="bg-ink-2 p-8">
                <dt className="font-display text-lg font-bold uppercase">{t}</dt>
                <dd className="text-steel mt-3 text-sm">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-4 py-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Marques Lab Innovation
            </p>
            <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold uppercase sm:text-5xl">
              O laboratório também constrói tecnologia.
            </h2>
          </Reveal>
          <ul className="mt-12 flex flex-wrap gap-3">
            {products.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/tecnologia/${p.slug}`}
                  className="hover:border-flame/60 inline-flex items-center gap-3 border border-white/15 px-4 py-3 text-sm transition-colors"
                >
                  {p.name}
                  <span className="text-flame-soft font-mono text-[10px] tracking-widest uppercase">
                    {p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12">
            <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Processo de trabalho
            </p>
          </Reveal>
          <ProcessSteps />
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-28 sm:px-8">
        <Reveal className="mx-auto max-w-7xl">
          <h2 className="font-display max-w-4xl text-4xl leading-[1] font-bold uppercase sm:text-6xl">
            Seu próximo projeto merece mais do que o comum.
          </h2>
          <div className="mt-10">
            <Button href="/contato">Solicitar um orçamento</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
