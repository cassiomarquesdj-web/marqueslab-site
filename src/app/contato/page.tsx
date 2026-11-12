import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { hasWhatsapp, waLink } from "@/lib/contact";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description: "Solicite um orçamento ao Marques Lab ou fale pelo WhatsApp e Instagram.",
  alternates: { canonical: "/contato" },
};

type Props = { searchParams: Promise<{ servico?: string }> };

export default async function ContatoPage({ searchParams }: Props) {
  const { servico } = await searchParams;
  const wa = waLink("Olá! Vim pelo site do Marques Lab e gostaria de falar sobre um projeto.");

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos transformar sua ideia em um projeto extraordinário?"
        text="Conte o que você precisa. Sem cadastro: você preenche, recebe um protocolo e seguimos a conversa."
      />
      <Section>
        <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr]">
          <QuoteForm defaultCategory={servico} />
          <aside className="space-y-8">
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Outros canais
            </h2>
            <ul className="space-y-5">
              {hasWhatsapp && wa && (
                <li>
                  <a
                    className="hover:text-flame-soft text-lg underline"
                    href={wa}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <a
                  className="hover:text-flame-soft text-lg underline"
                  href={site.instagram}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram {site.instagramHandle}
                </a>
              </li>
              {site.email && (
                <li>
                  <a
                    className="hover:text-flame-soft text-lg underline"
                    href={`mailto:${site.email}`}
                  >
                    {site.email}
                  </a>
                </li>
              )}
              <li className="text-steel">{site.url.replace("https://", "")}</li>
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
