import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente anônimo, sem cookies: permite cache/ISR nas páginas públicas. */
export function createPublicClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
