"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/portfolio";
import { Cover } from "@/components/ui/Cover";
import { cn } from "@/lib/utils/cn";

type Props = { projects: Project[]; categories: string[] };

export function PortfolioGrid({ projects, categories }: Props) {
  const filters = ["Todos", ...categories];
  const [active, setActive] = useState("Todos");
  const visible = active === "Todos" ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <div role="group" aria-label="Filtrar por categoria" className="mb-12 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => setActive(f)}
            className={cn(
              "border px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors",
              active === f
                ? "border-flame bg-flame text-ink"
                : "text-steel hover:border-flame/60 border-white/15 hover:text-white",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-steel border border-dashed border-white/15 p-10">
          Nenhum projeto publicado nesta categoria ainda.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-6">
          {visible.map((p, i) => (
            <li key={p.slug} className={cn(i % 3 === 0 ? "md:col-span-4" : "md:col-span-2")}>
              <Link href={`/portfolio/${p.slug}`} className="group block">
                <Cover
                  url={p.coverUrl}
                  label={p.category}
                  alt={p.title}
                  demo={p.demo}
                  className={cn(
                    "transition-transform duration-500 group-hover:-translate-y-1",
                    i % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/5]",
                  )}
                />
                <h2 className="font-display group-hover:text-flame-soft mt-4 text-xl font-bold uppercase transition-colors">
                  {p.title}
                </h2>
                <p className="text-steel mt-1 text-sm">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
