type Item = { q: string; a: string };

export function Faq({ items }: { items: Item[] }) {
  return (
    <div className="max-w-3xl divide-y divide-white/10 border-y border-white/10">
      {items.map((i) => (
        <details key={i.q} className="group py-5">
          <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
            {i.q}
            <span className="text-flame font-mono transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="text-steel mt-3">{i.a}</p>
        </details>
      ))}
    </div>
  );
}
