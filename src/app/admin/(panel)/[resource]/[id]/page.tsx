import Link from "next/link";
import { notFound } from "next/navigation";
import { saveResource } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { getResource } from "@/lib/admin/resources";
import { AdminButton, Notice, PageTitle } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";

type Props = {
  params: Promise<{ resource: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ResourceEditPage({ params, searchParams }: Props) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  const s = await requireRole(resource.roles);
  const sp = await searchParams;
  const isCreate = id === "novo";

  let values: Record<string, unknown> = {};
  if (isCreate) {
    // pré-preenche relações vindas da URL (ex.: nova mídia de um projeto)
    for (const f of resource.fields)
      if (f.type === "relation" && sp[f.name]) values[f.name] = sp[f.name];
    values = { active: true, published: true, ...values };
  } else {
    const { data } = await s.supabase.from(resource.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    values = data;
  }

  const relationOptions: Record<string, { value: string; label: string }[]> = {};
  for (const f of resource.fields) {
    if (f.type !== "relation" || !f.relation) continue;
    const { data } = await s.supabase
      .from(f.relation.table)
      .select(`id,${f.relation.label}`)
      .order(f.relation.label)
      .limit(500);
    relationOptions[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({
      value: r.id,
      label: r[f.relation!.label],
    }));
  }

  // listas relacionadas (ex.: mídias do projeto, leads do cliente)
  const relatedLists = isCreate
    ? []
    : await Promise.all(
        (resource.related ?? []).map(async (rel) => {
          const target = getResource(rel.resource)!;
          const { data } = await s.supabase
            .from(target.table)
            .select("id,*")
            .eq(rel.fk, id)
            .limit(50);
          return { rel, target, rows: (data ?? []) as Record<string, unknown>[] };
        }),
      );

  const clientLeads =
    resource.key === "clientes" && !isCreate
      ? ((await s.supabase.from("leads").select("id,protocol,category,status").eq("client_id", id))
          .data ?? [])
      : [];
  const clientProjects =
    resource.key === "clientes" && !isCreate
      ? ((await s.supabase.from("projects").select("id,title,status").eq("client_id", id)).data ??
        [])
      : [];

  return (
    <>
      <PageTitle title={isCreate ? `Novo ${resource.singular}` : `Editar ${resource.singular}`}>
        <AdminButton href={`/admin/${resource.key}`} variant="ghost">
          Voltar
        </AdminButton>
      </PageTitle>
      <Notice params={sp} />
      <ResourceForm
        resource={resource}
        action={saveResource.bind(null, resource.key, isCreate ? null : id)}
        values={values}
        isCreate={isCreate}
        relationOptions={relationOptions}
      />

      {relatedLists.map(({ rel, target, rows }) => (
        <section key={rel.resource} className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase">{rel.label}</h2>
            <AdminButton href={`/admin/${rel.resource}/novo?${rel.fk}=${id}`}>
              Adicionar
            </AdminButton>
          </div>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
            {rows.length === 0 && <li className="text-steel py-3">Nada cadastrado.</li>}
            {rows.map((r) => (
              <li key={String(r.id)} className="flex justify-between py-3">
                <span>{String(r[target.titleField] ?? r.title ?? r.kind ?? r.id)}</span>
                <Link
                  href={`/admin/${rel.resource}/${r.id}`}
                  className="text-flame-soft hover:underline"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {resource.key === "clientes" && !isCreate && (
        <section className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-bold uppercase">Histórico de orçamentos</h2>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
              {clientLeads.length === 0 && <li className="text-steel py-3">Nenhum orçamento.</li>}
              {clientLeads.map((l) => (
                <li key={l.id} className="py-3">
                  <Link
                    href={`/admin/orcamentos/${l.id}`}
                    className="text-flame-soft hover:underline"
                  >
                    {l.protocol}
                  </Link>{" "}
                  · {l.category}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold uppercase">Projetos</h2>
            <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
              {clientProjects.length === 0 && <li className="text-steel py-3">Nenhum projeto.</li>}
              {clientProjects.map((p) => (
                <li key={p.id} className="py-3">
                  {p.title}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
