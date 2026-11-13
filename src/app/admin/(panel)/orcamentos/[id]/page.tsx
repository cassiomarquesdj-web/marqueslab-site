import Link from "next/link";
import { notFound } from "next/navigation";
import { createClientFromLead, updateLead } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { leadStatusLabel, leadStatuses } from "@/lib/admin/resources";
import { buildWaLink } from "@/lib/contact";
import { AdminButton, Notice, PageTitle } from "@/components/admin/ui";
import { LeadForm } from "@/components/admin/SimpleForms";
import { SubmitButton } from "@/components/admin/SubmitButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; salvo?: string }>;
};

export default async function LeadDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const s = await requireRole(["admin", "sales"]);
  const sp = await searchParams;

  const { data: lead } = await s.supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();
  const { data: history } = await s.supabase
    .from("lead_history")
    .select("id,action,from_status,to_status,note,created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const files = await Promise.all(
    ((lead.attachments ?? []) as { path: string; name: string }[]).map(async (a) => {
      const { data } = await s.supabase.storage
        .from("lead-references")
        .createSignedUrl(a.path, 300);
      return { name: a.name, url: data?.signedUrl };
    }),
  );
  const wa = buildWaLink(
    lead.whatsapp,
    `Olá ${lead.name}, aqui é do Marques Lab sobre o orçamento ${lead.protocol}.`,
  );
  const row = (k: string, v: string | null) => (
    <div className="grid gap-1 border-b border-white/10 py-3 sm:grid-cols-[10rem_1fr]">
      <dt className="text-steel font-mono text-xs tracking-widest uppercase">{k}</dt>
      <dd className="whitespace-pre-line">{v || "—"}</dd>
    </div>
  );

  return (
    <>
      <PageTitle title={lead.protocol}>
        <AdminButton href="/admin/orcamentos" variant="ghost">
          Voltar
        </AdminButton>
        {wa && <AdminButton href={wa}>WhatsApp</AdminButton>}
      </PageTitle>
      <Notice params={sp} />

      <div className="grid gap-12 xl:grid-cols-2">
        <dl>
          {row("Nome", lead.name)}
          {row("Empresa", lead.company)}
          {row("WhatsApp", lead.whatsapp)}
          {row("E-mail", lead.email)}
          {row("Serviço", lead.category)}
          {row("Prazo", lead.deadline)}
          {row("Investimento", lead.budget)}
          {row("Recebido em", new Date(lead.created_at).toLocaleString("pt-BR"))}
          {row("Descrição", lead.description)}
          <div className="py-3">
            <dt className="text-steel font-mono text-xs tracking-widest uppercase">Referências</dt>
            <dd className="mt-2">
              {files.length === 0 && "—"}
              {files.map((f) =>
                f.url ? (
                  <a
                    key={f.name}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-flame-soft block underline"
                  >
                    {f.name}
                  </a>
                ) : (
                  <span key={f.name} className="block">
                    {f.name}
                  </span>
                ),
              )}
            </dd>
          </div>
        </dl>

        <div>
          <LeadForm
            action={updateLead.bind(null, id)}
            statuses={leadStatuses}
            status={lead.status}
            notes={lead.notes ?? ""}
          />

          <div className="mt-8">
            {lead.client_id ? (
              <Link
                href={`/admin/clientes/${lead.client_id}`}
                className="text-flame-soft underline"
              >
                Ver cliente vinculado
              </Link>
            ) : (
              <form action={createClientFromLead.bind(null, id)}>
                <button className="hover:border-flame border border-white/20 px-4 py-2.5 font-mono text-xs tracking-widest uppercase">
                  Criar cliente a partir deste contato
                </button>
              </form>
            )}
          </div>

          <h2 className="font-display mt-10 text-xl font-bold uppercase">Histórico</h2>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
            {(history ?? []).map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span>
                  {h.action === "created" && "Solicitação criada"}
                  {h.action === "status" &&
                    `Status: ${leadStatusLabel(h.from_status ?? "")} → ${leadStatusLabel(h.to_status ?? "")}`}
                  {h.action === "note" && `Observação: ${h.note ?? "(removida)"}`}
                </span>
                <time className="text-steel" dateTime={h.created_at}>
                  {new Date(h.created_at).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
