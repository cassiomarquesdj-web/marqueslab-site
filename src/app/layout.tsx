import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { Cursor } from "@/components/animations/Cursor";
import { site } from "@/lib/site";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description:
    "Design, tecnologia, audiovisual e criatividade para transformar projetos em experiências que deixam marcas.",
  openGraph: { siteName: site.name, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#090909" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
        <Cursor />
      </body>
    </html>
  );
}
