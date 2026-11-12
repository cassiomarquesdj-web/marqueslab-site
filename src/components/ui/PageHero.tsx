type Props = { eyebrow: string; title: string; text?: string; children?: React.ReactNode };

export function PageHero({ eyebrow, title, text, children }: Props) {
  return (
    <section className="relative overflow-hidden px-4 pt-40 pb-20 sm:px-8">
      <div
        aria-hidden
        className="absolute -top-40 -right-40 size-[40rem] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.14),transparent_65%)]"
      />
      <div className="animate-rise relative mx-auto max-w-7xl">
        <p className="text-flame font-mono text-xs tracking-[0.25em] uppercase">{eyebrow}</p>
        <h1 className="font-display mt-6 max-w-5xl text-[clamp(2.25rem,6.5vw,5.5rem)] leading-[0.98] font-bold uppercase">
          {title}
        </h1>
        {text && <p className="text-steel mt-8 max-w-2xl text-lg">{text}</p>}
        {children && <div className="mt-10 flex flex-wrap gap-4">{children}</div>}
      </div>
    </section>
  );
}
