import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente com a sessão do usuário (cookies). Retorna null se o Supabase não está configurado. */
export async function createClient() {
  if (!isSupabaseConfigured()) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Chamado de Server Component: o proxy renova a sessão.
        }
      },
    },
  });
}
