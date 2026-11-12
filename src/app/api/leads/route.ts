import { NextResponse } from "next/server";
import { leadSchema } from "@/schemas/lead";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_data" }, { status: 422 });
  }

  // Robôs preenchem a isca: finge sucesso sem gravar nada.
  if (parsed.data.website) {
    return NextResponse.json({ protocol: "ML-0000" });
  }

  // A gravação em `leads` (Supabase) entra na Sprint 05. Sem ela, não simulamos sucesso.
  return NextResponse.json({ error: "not_configured" }, { status: 503 });
}
