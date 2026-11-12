import { cn } from "@/lib/utils/cn";

type Props = { label: string; demo?: boolean; className?: string };

/** Capa conceitual para quando ainda não há mídia real cadastrada. */
export function ConceptCover({ label, demo = true, className }: Props) {
  return (
    <div
      className={cn(
        "bg-ink-3 relative isolate flex aspect-[4/3] items-end overflow-hidden p-5",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 200 150"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 -z-10 size-full opacity-60"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.06" />
          </pattern>
        </defs>
        <rect width="200" height="150" fill="url(#grid)" />
        <path d="M0 150 L120 0 H150 L30 150 Z" fill="#ff6a00" fillOpacity="0.14" />
        <path d="M60 150 L170 20 V150 Z" fill="#fff" fillOpacity="0.04" />
      </svg>
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/70 uppercase">
        {label}
      </span>
      {demo && (
        <span className="border-flame/60 text-flame-soft absolute top-4 left-4 border px-2 py-1 font-mono text-[10px] tracking-widest uppercase">
          Demonstração
        </span>
      )}
    </div>
  );
}
