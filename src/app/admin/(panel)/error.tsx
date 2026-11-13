"use client";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="max-w-xl border border-red-500/40 bg-red-500/10 p-6">
      <h1 className="font-display text-xl font-bold uppercase">Algo deu errado</h1>
      <p className="text-steel mt-2 text-sm">
        Não foi possível carregar esta página. Verifique sua conexão e permissões e tente de novo.
      </p>
      <button
        onClick={reset}
        className="bg-flame text-ink mt-4 px-4 py-2.5 font-mono text-xs tracking-widest uppercase"
      >
        Tentar novamente
      </button>
    </div>
  );
}
