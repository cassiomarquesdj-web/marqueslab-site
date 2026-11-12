import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/admin/resources";

export type AdminSession = {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  userId: string;
  email: string;
  name: string;
  role: Role;
};

/** Sessão do painel: usuário autenticado, ativo e com perfil. null se não houver. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,active")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!profile || !profile.active) return null;
  return {
    supabase,
    userId: auth.user.id,
    email: auth.user.email ?? "",
    name: profile.full_name ?? auth.user.email ?? "",
    role: profile.role as Role,
  };
}

/** Exige login e um dos papéis permitidos; senão redireciona. Use em páginas e ações. */
export async function requireRole(allowed: Role[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!allowed.includes(session.role)) redirect("/admin?negado=1");
  return session;
}

export async function logActivity(
  s: AdminSession,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {},
) {
  await s.supabase
    .from("activity_logs")
    .insert({ user_id: s.userId, action, entity, entity_id: entityId, meta });
}
