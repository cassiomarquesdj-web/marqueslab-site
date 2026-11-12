import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { getSettings } from "@/lib/data/content";
import { site } from "@/lib/site";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(site.url),
    title: { default: s.seoTitle, template: `%s | ${s.companyName}` },
    description: s.seoDescription,
    openGraph: { siteName: s.companyName, locale: "pt_BR", type: "website" },
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#090909" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
