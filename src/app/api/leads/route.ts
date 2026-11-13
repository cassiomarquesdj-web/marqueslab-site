import { NextResponse } from "next/server";
import { fieldErrorsFrom, leadSchema } from "@/schemas/lead";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { validateFiles } from "@/lib/uploads";

export const runtime = "nodejs";

// PRIVACIDADE: esta rota não registra (console/log) nenhum dado do orçamento; erros devolvem só códigos.

const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  // Toda a validação é refeita aqui; o navegador nunca é considerado confiável.
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_data", fields: fieldErrorsFrom(parsed.error.issues) },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Robôs preenchem a isca: finge sucesso sem gravar nada.
  if (d.website) return NextResponse.json({ protocol: "ML-000000" });

  const files = form.getAll("references").filter((f): f is File => f instanceof File && f.size > 0);
  const fileProblem = validateFiles(files);
  if (fileProblem) {
    return NextResponse.json({ error: "invalid_files", message: fileProblem }, { status: 422 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // Reenvio da mesma tentativa (ex.: a resposta se perdeu): devolve o protocolo já existente,
  // sem duplicar o orçamento, sem reenviar anexos e sem consumir o limite de requisições.
  if (d.idempotencyKey) {
    const { data: existing } = await db
      .from("leads")
      .select("protocol")
      .eq("idempotency_key", d.idempotencyKey)
      .maybeSingle();
    if (existing) return NextResponse.json({ protocol: existing.protocol, duplicate: true });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`lead:${ip}`))
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

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
      idempotency_key: d.idempotencyKey ?? null,
    })
    .select("id,protocol")
    .single();

  if (error?.code === "23505" && d.idempotencyKey) {
    // duas requisições simultâneas com a mesma chave: a segunda recebe o protocolo da primeira
    const { data: winner } = await db
      .from("leads")
      .select("protocol")
      .eq("idempotency_key", d.idempotencyKey)
      .maybeSingle();
    if (winner) return NextResponse.json({ protocol: winner.protocol, duplicate: true });
  }
  if (error || !lead) return NextResponse.json({ error: "save_failed" }, { status: 500 });

  // Anexos vão para um bucket privado. O orçamento já está salvo: falha em um arquivo não o derruba,
  // mas é informada (`attachmentsFailed`) para o cliente enviar o restante por outro canal.
  const attachments: { path: string; name: string }[] = [];
  for (const f of files) {
    const path = `${lead.id}/${Date.now()}-${safeName(f.name)}`;
    const { error: upErr } = await db.storage
      .from("lead-references")
      .upload(path, await f.arrayBuffer(), { contentType: f.type });
    if (!upErr) attachments.push({ path, name: f.name });
  }
  if (attachments.length) {
    const { error: linkErr } = await db.from("leads").update({ attachments }).eq("id", lead.id);
    if (linkErr) {
      // não deixa arquivo órfão: se não foi possível vinculá-los ao orçamento, remove-os do bucket
      await db.storage.from("lead-references").remove(attachments.map((a) => a.path));
      return NextResponse.json({
        protocol: lead.protocol,
        attachmentsFailed: files.length,
      });
    }
  }

  return NextResponse.json({
    protocol: lead.protocol,
    ...(attachments.length < files.length && {
      attachmentsFailed: files.length - attachments.length,
    }),
  });
}
