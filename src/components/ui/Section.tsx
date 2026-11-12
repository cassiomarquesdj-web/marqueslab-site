import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils/cn";

type Props = {
  label?: string;
  title?: string;
  tone?: "base" | "raised";
  children: React.ReactNode;
};

export function Section({ label, title, tone = "base", children }: Props) {
  return (
    <section className={cn("px-4 py-24 sm:px-8", tone === "raised" && "bg-ink-2")}>
      <div className="mx-auto max-w-7xl">
        {(label || title) && (
          <Reveal className="mb-14">
            {label && (
              <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">{label}</p>
            )}
            {title && (
              <h2 className="font-display mt-4 max-w-3xl text-3xl font-bold uppercase sm:text-5xl">
                {title}
              </h2>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
