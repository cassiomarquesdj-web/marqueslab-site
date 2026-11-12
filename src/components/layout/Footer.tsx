import Link from "next/link";
import { nav } from "@/lib/site";
import type { SiteSettings } from "@/lib/data/content";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-ink-2 border-t border-white/10 px-4 py-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-bold">
            MARQUES<span className="text-flame">LAB</span>
          </p>
          <p className="text-steel mt-2 font-mono text-xs tracking-widest uppercase">
            Laboratório de impacto visual
          </p>
          <p className="text-steel mt-6 max-w-sm text-sm">
            Criatividade sem limites. Tecnologia sem fronteiras.
          </p>
          {settings.companyInfo && (
            <p className="text-steel mt-4 max-w-sm text-sm whitespace-pre-line">
              {settings.companyInfo}
            </p>
          )}
        </div>
        <nav aria-label="Rodapé" className="font-mono text-xs tracking-widest uppercase">
          <ul className="space-y-3">
            {nav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-steel hover:text-white">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="space-y-3 font-mono text-xs tracking-widest uppercase">
          <li>
            <a
              href={settings.instagram}
              rel="noopener noreferrer"
              target="_blank"
              className="text-steel hover:text-white"
            >
              Instagram
            </a>
          </li>
          {settings.email && (
            <li>
              <a href={`mailto:${settings.email}`} className="text-steel hover:text-white">
                E-mail
              </a>
            </li>
          )}
        </ul>
      </div>
      <p className="text-steel mx-auto mt-12 max-w-7xl font-mono text-[10px] tracking-widest uppercase">
        © {new Date().getFullYear()} {settings.companyName}
      </p>
    </footer>
  );
}
