import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { leadStatusLabel } from "@/lib/admin/resources";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const s = await getAdminSession();
  if (!s || !["admin", "sales"].includes(s.role))
    return new NextResponse("Não autorizado", { status: 401 });

  const p = req.nextUrl.searchParams;
  let query = s.supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (p.get("status")) query = query.eq("status", p.get("status")!);
  if (p.get("categoria")) query = query.eq("category", p.get("categoria")!);
  const q = p.get("q")?.replace(/[%_,()]/g, "");
  if (q)
    query = query.or(
      `name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,protocol.ilike.%${q}%`,
    );

  const { data } = await query;
  const csv = toCsv(
    [
      "Protocolo",
      "Recebido em",
      "Nome",
      "Empresa",
      "WhatsApp",
      "E-mail",
      "Serviço",
      "Prazo",
      "Investimento",
      "Status",
      "Descrição",
      "Observações",
    ],
    (data ?? []).map((l) => [
      l.protocol,
      l.created_at,
      l.name,
      l.company,
      l.whatsapp,
      l.email,
      l.category,
      l.deadline,
      l.budget,
      leadStatusLabel(l.status),
      l.description,
      l.notes,
    ]),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orcamentos-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
