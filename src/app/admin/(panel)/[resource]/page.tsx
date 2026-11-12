import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteResource } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { getResource } from "@/lib/admin/resources";
import { AdminButton, Notice, PageTitle, inputCls } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ResourceListPage({ params, searchParams }: Props) {
  const resource = getResource((await params).resource);
  if (!resource) notFound();
  const s = await requireRole(resource.roles);
  const sp = await searchParams;

  let query = s.supabase
    .from(resource.table)
    .select("*")
    .order(resource.order[0], { ascending: resource.order[1] })
    .limit(200);
  if (sp.q) query = query.ilike(resource.titleField, `%${sp.q.replace(/[%_]/g, "")}%`);
  const filters: Record<string, string> = {};
  for (const f of resource.fields)
    if (f.type === "relation" && sp[f.name]) {
      filters[f.name] = sp[f.name]!;
      query = query.eq(f.name, sp[f.name]!);
    }
  const { data, error } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];
  const newHref = `/admin/${resource.key}/novo${
    Object.keys(filters).length ? `?${new URLSearchParams(filters)}` : ""
  }`;

  return (
    <>
      <PageTitle title={resource.label}>
        <AdminButton href={newHref}>Novo {resource.singular}</AdminButton>
      </PageTitle>
      <Notice params={sp} />
      {error && <p className="mb-4 text-sm text-red-300">Não foi possível carregar os dados.</p>}

      <form className="mb-6 flex max-w-md gap-2" role="search">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={`Buscar por ${resource.titleField}`}
          className={inputCls}
          aria-label="Buscar"
        />
        {Object.entries(filters).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button className="border border-white/20 px-4 font-mono text-xs tracking-widest uppercase">
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="text-steel font-mono text-xs tracking-widest uppercase">
            <tr>
              {resource.columns.map((c) => (
                <th key={c.field} className="border-b border-white/10 py-3 pr-4 font-normal">
                  {c.label}
                </th>
              ))}
              <th className="border-b border-white/10 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={resource.columns.length + 1} className="text-steel py-6">
                  Nenhum registro.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/10">
                {resource.columns.map((c) => (
                  <td key={c.field} className="py-3 pr-4">
                    {c.type === "boolean"
                      ? r[c.field]
                        ? "Sim"
                        : "Não"
                      : String(r[c.field] ?? "—")}
                  </td>
                ))}
                <td className="flex justify-end gap-5 py-3">
                  <Link
                    href={`/admin/${resource.key}/${r.id}`}
                    className="text-flame-soft font-mono text-xs tracking-widest uppercase hover:underline"
                  >
                    Editar
                  </Link>
                  <DeleteButton action={deleteResource.bind(null, resource.key, String(r.id))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
