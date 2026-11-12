import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { inputCls, submitCls } from "@/components/admin/ui";

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
          <form action={login} className="mt-8 space-y-5">
            {erro && (
              <p
                role="alert"
                className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {erro === "credenciais" ? "E-mail ou senha incorretos." : "Configuração inválida."}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs tracking-widest uppercase">
                E-mail
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs tracking-widest uppercase">
                Senha
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </label>
            <button type="submit" className={`${submitCls} w-full`}>
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
