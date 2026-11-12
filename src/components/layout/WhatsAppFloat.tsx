import { buildWaLink } from "@/lib/contact";

/** Só é renderizado quando o número do WhatsApp está configurado. */
export function WhatsAppFloat({ number }: { number: string }) {
  const href = buildWaLink(
    number,
    "Olá! Vim pelo site do Marques Lab e gostaria de falar sobre um projeto.",
  );
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="bg-flame text-ink hover:bg-flame-soft fixed right-4 bottom-4 z-40 px-5 py-3 font-mono text-xs font-medium tracking-widest uppercase transition-colors sm:right-8 sm:bottom-8"
    >
      WhatsApp
    </a>
  );
}
