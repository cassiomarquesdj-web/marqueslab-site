import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  className?: string;
};

export function Button({ href, variant = "primary", children, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 px-7 py-4 font-mono text-xs font-medium tracking-[0.18em] uppercase transition-colors [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]",
        variant === "primary"
          ? "bg-flame text-ink hover:bg-flame-soft"
          : "hover:border-flame hover:text-flame-soft border border-white/20 text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}
