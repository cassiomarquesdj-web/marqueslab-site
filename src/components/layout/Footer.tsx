import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-ink-2 border-t border-white/10 px-4 py-12 sm:px-8">
      <div className="text-steel mx-auto flex max-w-7xl flex-col gap-4 font-mono text-xs tracking-widest uppercase sm:flex-row sm:justify-between">
        <span>
          {site.name} — {site.tagline}
        </span>
        <a
          href={site.instagram}
          rel="noopener noreferrer"
          target="_blank"
          className="hover:text-white"
        >
          {site.instagramHandle}
        </a>
      </div>
    </footer>
  );
}
