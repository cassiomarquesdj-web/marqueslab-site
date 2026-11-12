import Link from "next/link";
import { nav } from "@/lib/site";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="bg-ink/70 fixed inset-x-0 top-0 z-50 border-b border-white/5 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          MARQUES<span className="text-flame">LAB</span>
        </Link>
        <nav
          aria-label="Principal"
          className="hidden gap-8 font-mono text-xs tracking-widest uppercase lg:flex"
        >
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="text-steel transition-colors hover:text-white"
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <Button href="/contato" className="hidden py-3 sm:inline-flex">
          Solicitar orçamento
        </Button>
      </div>
    </header>
  );
}
