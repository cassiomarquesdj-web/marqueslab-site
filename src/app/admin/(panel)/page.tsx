import { requireRole } from "@/lib/admin/auth";
import { leadStatusLabel } from "@/lib/admin/resources";
import { PageTitle } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ negado?: string }> };

const IN_PROGRESS = [
  "em_analise",
  "aguardando_informacoes",
  "proposta_enviada",
  "aprovado",
  "em_producao",
];

export default async function DashboardPage({ searchParams }: Props) {
  const s = await requireRole(["admin", "editor", "sales"]);
  const { negado } = await searchParams;
  const canContent = s.role !== "sales";
  const canSales = s.role !== "editor";

  const count = async (table: string, filter?: (q: any) => any) => {
    let q = s.supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [projects, published, drafts, leads, inProgress, clients, analytics, activity] =
    await Promise.all([
      canContent ? count("projects") : 0,
      canContent ? count("projects", (q) => q.eq("status", "published")) : 0,
      canContent ? count("projects", (q) => q.eq("status", "draft")) : 0,
      canSales ? count("leads") : 0,
      canSales ? count("leads", (q) => q.in("status", IN_PROGRESS)) : 0,
      canSales ? count("clients") : 0,
      s.role === "admin"
        ? s.supabase.from("site_settings").select("value").eq("key", "analytics_id").maybeSingle()
        : null,
      s.supabase
        .from("activity_logs")
        .select("action,entity,created_at,meta")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const cards: [string, number][] = [
    ...(canContent
      ? ([
          ["Total de projetos", projects],
          ["Publicados", published],
          ["Rascunhos", drafts],
        ] as [string, number][])
      : []),
    ...(canSales
      ? ([
          ["Solicitações recebidas", leads],
          ["Orçamentos em andamento", inProgress],
          ["Clientes cadastrados", clients],
        ] as [string, number][])
      : []),
  ];
  const hasAnalytics = !!analytics?.data?.value;

  return (
    <>
      <PageTitle title="Dashboard" />
      {negado && (
        <p
          role="alert"
          className="mb-6 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          Você não tem permissão para acessar essa área.
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, n]) => (
          <li key={label} className="border border-white/10 p-5">
            <p className="text-steel font-mono text-xs tracking-widest uppercase">{label}</p>
            <p className="font-display mt-2 text-4xl font-bold">{n}</p>
          </li>
        ))}
        <li className="border border-white/10 p-5">
          <p className="text-steel font-mono text-xs tracking-widest uppercase">
            Visitas e conversões
          </p>
          <p className="mt-2 text-sm">
            {hasAnalytics
              ? "Acompanhe no Google Analytics (ID configurado)."
              : s.role === "admin"
                ? "Informe o ID do Google Analytics em Configurações para ativar a medição."
                : "Medição ainda não configurada."}
          </p>
        </li>
      </ul>

      <h2 className="font-display mt-12 text-xl font-bold uppercase">Atividades recentes</h2>
      <ul className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
        {(activity.data ?? []).length === 0 && (
          <li className="text-steel py-3">Nenhuma atividade ainda.</li>
        )}
        {(activity.data ?? []).map((a, i) => (
          <li key={i} className="flex flex-wrap justify-between gap-2 py-3">
            <span>
              {a.action} · {a.entity}
              {(a.meta as { title?: string; status?: string })?.title
                ? ` · ${(a.meta as { title: string }).title}`
                : ""}
              {(a.meta as { status?: string })?.status
                ? ` · ${leadStatusLabel((a.meta as { status: string }).status)}`
                : ""}
            </span>
            <time className="text-steel" dateTime={a.created_at}>
              {new Date(a.created_at).toLocaleString("pt-BR")}
            </time>
          </li>
        ))}
      </ul>
    </>
  );
}
