"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { nav } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

export function Header({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = requestAnimationFrame(onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled || open
            ? "bg-ink/80 border-white/10 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-display text-lg font-bold tracking-tight"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Marques Lab" className="h-7 w-auto" />
            ) : (
              <>
                MARQUES<span className="text-flame">LAB</span>
              </>
            )}
          </Link>

          <nav
            aria-label="Principal"
            className="hidden gap-8 font-mono text-xs tracking-widest uppercase lg:flex"
          >
            {nav.map((i) => {
              const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-1 transition-colors hover:text-white",
                    active ? "text-white" : "text-steel",
                  )}
                >
                  {i.label}
                  {active && <span className="bg-flame absolute inset-x-0 -bottom-1 h-px" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Button href="/contato" className="py-3">
                Solicitar orçamento
              </Button>
            </div>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative flex size-11 flex-col items-center justify-center gap-[6px] lg:hidden"
            >
              <span
                className={cn(
                  "block h-px w-6 bg-white transition-transform",
                  open && "translate-y-[3.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "bg-flame block h-px w-6 transition-transform",
                  open && "-translate-y-[3.5px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-mobile"
            aria-label="Menu mobile"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ink fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col justify-between px-4 pt-10 pb-10 sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col">
              {nav.map((i, n) => (
                <li key={i.href} className="border-b border-white/10">
                  <Link
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className="font-display flex items-baseline gap-4 py-5 text-4xl font-bold uppercase"
                  >
                    <span className="text-flame font-mono text-xs">0{n + 1}</span>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button href="/contato" className="justify-center">
              Solicitar um orçamento
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
