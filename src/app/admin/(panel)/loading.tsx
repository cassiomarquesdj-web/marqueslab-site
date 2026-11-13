export default function PanelLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-4">
      <div className="bg-ink-3 h-9 w-64" />
      <div className="bg-ink-3 h-4 w-full max-w-xl" />
      <div className="bg-ink-3 h-4 w-full max-w-lg" />
      <div className="bg-ink-3 h-40 w-full max-w-3xl" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
