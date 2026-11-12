import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Section } from "@/components/ui/Section";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { buildWaLink } from "@/lib/contact";
import { getSettings } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Contato",
  description: "Solicite um orçamento ao Marques Lab ou fale pelo WhatsApp e Instagram.",
  alternates: { canonical: "/contato" },
};

type Props = { searchParams: Promise<{ servico?: string }> };

export default async function ContatoPage({ searchParams }: Props) {
  const [{ servico }, s] = await Promise.all([searchParams, getSettings()]);
  const wa = buildWaLink(
    s.whatsapp,
    "Olá! Vim pelo site do Marques Lab e gostaria de falar sobre um projeto.",
  );
  const link = "hover:text-flame-soft text-lg underline";

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos transformar sua ideia em um projeto extraordinário?"
        text="Conte o que você precisa. Sem cadastro: você preenche, recebe um protocolo e seguimos a conversa."
      />
      <Section>
        <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr]">
          <QuoteForm defaultCategory={servico} whatsapp={s.whatsapp} />
          <aside className="space-y-8">
            <h2 className="text-flame font-mono text-xs tracking-[0.25em] uppercase">
              Outros canais
            </h2>
            <ul className="space-y-5">
              {wa && (
                <li>
                  <a className={link} href={wa} rel="noopener noreferrer" target="_blank">
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <a className={link} href={s.instagram} rel="noopener noreferrer" target="_blank">
                  Instagram
                </a>
              </li>
              {s.email && (
                <li>
                  <a className={link} href={`mailto:${s.email}`}>
                    {s.email}
                  </a>
                </li>
              )}
            </ul>
            {s.companyInfo && (
              <p className="text-steel text-sm whitespace-pre-line">{s.companyInfo}</p>
            )}
          </aside>
        </div>
      </Section>
    </>
  );
}
