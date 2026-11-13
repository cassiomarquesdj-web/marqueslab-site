"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Props = { children: React.ReactNode; pendingLabel?: string; className?: string };

/** Botão de envio que mostra o estado de carregamento e impede cliques duplos. */
export function SubmitButton({ children, pendingLabel = "Salvando…", className }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "bg-flame text-ink hover:bg-flame-soft px-5 py-2.5 font-mono text-xs font-medium tracking-widest uppercase transition-colors disabled:opacity-60",
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
