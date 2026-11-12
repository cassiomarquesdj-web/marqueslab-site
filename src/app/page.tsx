import { Button } from "@/components/ui/Button";
import { Hero3D } from "@/components/hero/Hero3D";
import { Reveal } from "@/components/animations/Reveal";
import { departments } from "@/lib/departments";

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-svh items-end overflow-hidden px-4 pb-20 sm:px-8">
        <Hero3D />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <p className="text-flame mb-6 font-mono text-xs tracking-[0.25em] uppercase">
            Marques Lab — Laboratório de impacto visual
          </p>
          <h1 className="font-display max-w-4xl text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.95] font-bold uppercase">
            Ideias que se transformam em experiências.
          </h1>
          <p className="text-steel mt-8 max-w-xl text-lg">
            Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências
            que deixam marcas.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/contato">Solicitar um orçamento</Button>
            <Button href="/portfolio" variant="ghost">
              Explorar portfólio
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
              <li key={d.id}>
                <Reveal delay={i * 0.04}>
                  <div className="group grid gap-3 border-b border-white/10 py-8 transition-colors hover:bg-white/[0.02] md:grid-cols-[6rem_1fr_1.2fr] md:items-baseline">
                    <span className="text-steel group-hover:text-flame font-mono text-xs tracking-widest transition-colors">
                      DEP. 0{i + 1}
                    </span>
                    <h3 className="font-display text-2xl font-bold uppercase">{d.name}</h3>
                    <p className="text-steel">{d.summary}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-28 sm:px-8">
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
