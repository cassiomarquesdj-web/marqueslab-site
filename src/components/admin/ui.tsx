import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export const inputCls =
  "bg-ink-2 w-full border border-white/15 px-3 py-3 text-sm text-white focus:border-flame focus:outline-none";

export function Notice({
  params,
}: {
  params: { erro?: string; salvo?: string; excluido?: string };
}) {
  if (params.erro)
    return (
      <p
        role="alert"
        className="mb-6 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
      >
        {params.erro}
      </p>
    );
  if (params.salvo || params.excluido)
    return (
      <p role="status" className="border-flame/40 bg-flame/10 mb-6 border p-3 text-sm">
        {params.excluido ? "Registro excluído." : "Alterações salvas."}
      </p>
    );
  return null;
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-3xl font-bold uppercase">{title}</h1>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

export function AdminButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2.5 font-mono text-xs tracking-widest uppercase transition-colors",
        variant === "primary"
          ? "bg-flame text-ink hover:bg-flame-soft"
          : "hover:border-flame border border-white/20",
      )}
    >
      {children}
    </Link>
  );
}

export const submitCls =
  "bg-flame text-ink hover:bg-flame-soft px-5 py-2.5 font-mono text-xs font-medium tracking-widest uppercase transition-colors";
