import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/admin/SimpleForms";

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { erro } = await searchParams;
  if (await getAdminSession()) redirect("/admin");
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl font-bold">
          MARQUES<span className="text-flame">LAB</span>
          <span className="text-steel ml-3 font-mono text-xs tracking-widest">CMS</span>
        </p>
        {!configured ? (
          <p className="text-steel mt-8 border border-white/15 p-4 text-sm">
            O Supabase ainda não está configurado. Preencha <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code> e reinicie o
            servidor. Veja o README.
          </p>
        ) : (
          <LoginForm action={login} />
        )}
      </div>
    </div>
  );
}
