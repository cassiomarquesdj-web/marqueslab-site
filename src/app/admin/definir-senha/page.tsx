"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputCls } from "@/components/admin/ui";

type View = "carregando" | "form" | "invalido" | "ok";

/**
 * Destino do link de convite / recuperação de senha do Supabase. O link chega com os tokens no
 * fragmento da URL (#access_token=…); aqui eles viram sessão e o usuário define a própria senha.
 * A senha nunca passa pelo nosso servidor: vai direto ao Supabase Auth.
 */
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const supabase = createClient();
    (async () => {
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, "", window.location.pathname); // tira os tokens da URL
        setView(error ? "invalido" : "form");
        return;
      }
      const { data } = await supabase.auth.getUser();
      setView(data.user ? "form" : "invalido");
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const senha = String(form.get("senha") ?? "");
    if (senha.length < 12) return setErro("Use pelo menos 12 caracteres.");
    if (senha !== String(form.get("confirmar") ?? "")) return setErro("As senhas não coincidem.");
    setErro(null);
    setEnviando(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return setErro("Não foi possível salvar a senha. Peça um novo convite.");
    setView("ok");
    window.setTimeout(() => router.push("/admin"), 1200);
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl font-bold">
          MARQUES<span className="text-flame">LAB</span>
          <span className="text-steel ml-3 font-mono text-xs tracking-widest">CMS</span>
        </p>
        <h1 className="font-display mt-8 text-xl font-bold uppercase">Definir senha</h1>

        {view === "carregando" && (
          <p role="status" className="text-steel mt-4 text-sm">
            Validando o link…
          </p>
        )}
        {view === "invalido" && (
          <p
            role="alert"
            className="mt-4 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            Link inválido ou expirado. Peça um novo convite ao administrador.
          </p>
        )}
        {view === "ok" && (
          <p role="status" className="border-flame/40 bg-flame/10 mt-4 border p-3 text-sm">
            Senha definida! Entrando no painel…
          </p>
        )}
        {view === "form" && (
          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            {erro && (
              <p
                role="alert"
                className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {erro}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs tracking-widest uppercase">
                Nova senha (mín. 12 caracteres)
              </span>
              <input
                name="senha"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-xs tracking-widest uppercase">
                Confirmar senha
              </span>
              <input
                name="confirmar"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              disabled={enviando}
              className="bg-flame text-ink hover:bg-flame-soft w-full px-5 py-2.5 font-mono text-xs font-medium tracking-widest uppercase disabled:opacity-60"
            >
              {enviando ? "Salvando…" : "Salvar senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
