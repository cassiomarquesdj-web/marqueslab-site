import Link from "next/link";
import { requireRole } from "@/lib/admin/auth";
import { leadStatusLabel, leadStatuses } from "@/lib/admin/resources";
import { leadCategories } from "@/schemas/lead";
import { AdminButton, inputCls, PageTitle } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ q?: string; status?: string; categoria?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  const s = await requireRole(["admin", "sales"]);
  const { q, status, categoria } = await searchParams;

  let query = s.supabase
    .from("leads")
    .select("id,protocol,name,company,category,status,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status) query = query.eq("status", status);
  if (categoria) query = query.eq("category", categoria);
  if (q) {
    const t = q.replace(/[%_,()]/g, "");
    query = query.or(
      `name.ilike.%${t}%,company.ilike.%${t}%,email.ilike.%${t}%,protocol.ilike.%${t}%`,
    );
  }
  const { data } = await query;
  const exportQs = new URLSearchParams(
    Object.entries({ q, status, categoria }).filter(([, v]) => v) as [string, string][],
  );

  return (
    <>
      <PageTitle title="Orçamentos">
        <AdminButton href={`/admin/export/leads?${exportQs}`} variant="ghost">
          Exportar CSV
        </AdminButton>
      </PageTitle>

      <form className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome, empresa, e-mail ou protocolo"
          className={inputCls}
          aria-label="Buscar"
        />
        <select name="status" defaultValue={status ?? ""} className={inputCls} aria-label="Status">
          <option value="">Todos os status</option>
          {leadStatuses.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className={inputCls}
          aria-label="Serviço"
        >
          <option value="">Todos os serviços</option>
          {leadCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="border border-white/20 px-4 font-mono text-xs tracking-widest uppercase">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-steel font-mono text-xs tracking-widest uppercase">
            <tr>
              {["Protocolo", "Nome", "Serviço", "Status", "Recebido"].map((h) => (
                <th key={h} className="border-b border-white/10 py-3 pr-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-steel py-6">
                  Nenhuma solicitação.
                </td>
              </tr>
            )}
            {(data ?? []).map((l) => (
              <tr key={l.id} className="border-b border-white/10">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/orcamentos/${l.id}`}
                    className="text-flame-soft hover:underline"
                  >
                    {l.protocol}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  {l.name}
                  {l.company ? ` · ${l.company}` : ""}
                </td>
                <td className="py-3 pr-4">{l.category}</td>
                <td className="py-3 pr-4">{leadStatusLabel(l.status)}</td>
                <td className="text-steel py-3">
                  {new Date(l.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
