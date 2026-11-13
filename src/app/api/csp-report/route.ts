import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Recebe relatórios de violação da CSP (Report-Only). Só registra no log da Vercel
 * (Runtime Logs), com tamanho e frequência limitados; nada é gravado no banco.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`csp:${ip}`, 30, 60 * 1000)) return new NextResponse(null, { status: 204 });

  const text = (await req.text()).slice(0, 4000);
  console.warn("[csp-report]", text);
  return new NextResponse(null, { status: 204 });
}
