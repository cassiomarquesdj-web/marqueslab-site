import type { Metadata } from "next";

// O painel nunca deve ser pré-renderizado: depende de sessão.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Marques Lab CMS" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-ink min-h-svh">{children}</div>;
}
