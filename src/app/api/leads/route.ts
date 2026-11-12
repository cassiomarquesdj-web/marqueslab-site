import { NextResponse } from "next/server";
import { leadSchema } from "@/schemas/lead";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { validateFiles } from "@/lib/uploads";

export const runtime = "nodejs";

const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`lead:${ip}`))
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid_data" }, { status: 422 });

  // Robôs preenchem a isca: finge sucesso sem gravar nada.
  if (parsed.data.website) return NextResponse.json({ protocol: "ML-000000" });

  const files = form.getAll("references").filter((f): f is File => f instanceof File && f.size > 0);
  if (validateFiles(files)) return NextResponse.json({ error: "invalid_files" }, { status: 422 });

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const d = parsed.data;
  const { data: lead, error } = await db
    .from("leads")
    .insert({
      name: d.name,
      company: d.company || null,
      whatsapp: d.whatsapp,
      email: d.email,
      category: d.category,
      description: d.description,
      deadline: d.deadline || null,
      budget: d.budget || null,
    })
    .select("id,protocol")
    .single();
  if (error || !lead) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  // Anexos vão para um bucket privado; falha em um arquivo não derruba o orçamento já salvo.
  const attachments: { path: string; name: string }[] = [];
  for (const f of files) {
    const path = `${lead.id}/${Date.now()}-${safeName(f.name)}`;
    const { error: upErr } = await db.storage
      .from("lead-references")
      .upload(path, await f.arrayBuffer(), { contentType: f.type });
    if (!upErr) attachments.push({ path, name: f.name });
  }
  if (attachments.length) await db.from("leads").update({ attachments }).eq("id", lead.id);

  return NextResponse.json({ protocol: lead.protocol });
}
