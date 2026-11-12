import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <section className="relative flex min-h-screen items-end px-4 pb-24 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-flame mb-6 font-mono text-xs tracking-[0.25em] uppercase">
          Laboratório de impacto visual
        </p>
        <h1 className="font-display max-w-5xl text-5xl leading-[0.95] font-bold uppercase sm:text-7xl lg:text-8xl">
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
  );
}
