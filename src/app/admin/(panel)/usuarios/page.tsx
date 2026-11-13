import { inviteUser, updateUser } from "@/app/admin/actions";
import { requireRole } from "@/lib/admin/auth";
import { roleLabels, type Role } from "@/lib/admin/resources";
import { createAdminClient } from "@/lib/supabase/admin";
import { Notice, PageTitle, inputCls } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";

type Props = { searchParams: Promise<{ erro?: string; salvo?: string }> };

export default async function UsersPage({ searchParams }: Props) {
  const s = await requireRole(["admin"]);
  const sp = await searchParams;
  const { data: profiles } = await s.supabase
    .from("profiles")
    .select("id,full_name,role,active")
    .order("created_at");

  // e-mails ficam em auth.users; exigem a service role (somente servidor)
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    data?.users.forEach((u) => emails.set(u.id, u.email ?? ""));
  }

  return (
    <>
      <PageTitle title="Usuários e permissões" />
      <Notice params={sp} />

      <ul className="divide-y divide-white/10 border-y border-white/10">
        {(profiles ?? []).map((p) => (
          <li key={p.id} className="py-4">
            <form
              action={updateUser.bind(null, p.id)}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="min-w-48 flex-1">
                <p>{p.full_name || "—"}</p>
                <p className="text-steel text-xs">{emails.get(p.id) ?? ""}</p>
              </div>
              <select
                name="role"
                defaultValue={p.role}
                className={`${inputCls} w-auto`}
                aria-label="Papel"
              >
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={p.active}
                  className="accent-flame size-4"
                />
                Ativo
              </label>
              <SubmitButton>Salvar</SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="font-display mt-12 text-xl font-bold uppercase">Convidar usuário</h2>
      {admin ? (
        <form action={inviteUser} className="mt-4 flex max-w-xl flex-wrap gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            aria-label="E-mail"
            className={`${inputCls} flex-1`}
          />
          <select
            name="role"
            className={`${inputCls} w-auto`}
            aria-label="Papel"
            defaultValue="editor"
          >
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
          <SubmitButton pendingLabel="Enviando…">Enviar convite</SubmitButton>
        </form>
      ) : (
        <p className="text-steel mt-4 text-sm">
          Defina <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor para convidar usuários por
          e-mail.
        </p>
      )}
    </>
  );
}
