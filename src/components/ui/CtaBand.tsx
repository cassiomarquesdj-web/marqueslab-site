import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/animations/Reveal";

type Props = { title?: string; category?: string };

export function CtaBand({
  title = "Vamos transformar sua ideia em um projeto extraordinário?",
  category,
}: Props) {
  const href = category ? `/contato?servico=${encodeURIComponent(category)}` : "/contato";
  return (
    <section className="border-t border-white/10 px-4 py-28 sm:px-8">
      <Reveal className="mx-auto max-w-7xl">
        <h2 className="font-display max-w-4xl text-4xl leading-[1] font-bold uppercase sm:text-6xl">
          {title}
        </h2>
        <div className="mt-10">
          <Button href={href}>Solicitar um orçamento</Button>
        </div>
      </Reveal>
    </section>
  );
}
