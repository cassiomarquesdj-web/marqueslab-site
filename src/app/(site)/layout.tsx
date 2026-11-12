import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { Cursor } from "@/components/animations/Cursor";
import { getSettings } from "@/lib/data/content";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <Header logoUrl={s.logoUrl} />
      <main>{children}</main>
      <Footer settings={s} />
      <WhatsAppFloat number={s.whatsapp} />
      <Cursor />
      {/^G-[A-Z0-9]+$/.test(s.analyticsId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${s.analyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${s.analyticsId}');`}
          </Script>
        </>
      )}
    </>
  );
}
