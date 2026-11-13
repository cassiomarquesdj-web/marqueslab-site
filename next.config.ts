import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * CSP em modo Report-Only: o navegador registra violações (console e /api/csp-report) sem bloquear.
 * 'unsafe-inline' em script/style é necessário hoje (scripts inline do Next e do GA, estilos do
 * framework). Depois de homologar sem violações inesperadas, migrar para nonce e trocar o cabeçalho
 * para `Content-Security-Policy`. Veja docs/DEPLOY.md.
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  `media-src 'self' blob:${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  `connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ""}`,
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Server Actions só levam formulários pequenos: uploads grandes vão direto ao Storage.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
        ],
      },
    ];
  },
};

export default nextConfig;
