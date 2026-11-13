/** Estado devolvido pelas ações dos formulários do painel (em vez de redirecionar com a mensagem na URL). */
export type FormState = {
  /** mensagem geral (conexão, servidor, permissão) */
  error?: string;
  /** mensagens por campo, exibidas junto do campo */
  fieldErrors?: Record<string, string>;
  /** valores digitados, devolvidos para o formulário não ser apagado */
  values?: Record<string, string>;
};

const SENSITIVE = /(pass|senha|secret|token)/i;

/**
 * Copia o que o usuário digitou (somente texto) para devolver ao formulário depois de um erro.
 * Arquivos não entram (o navegador não permite restaurá-los) e campos de senha nunca são devolvidos.
 */
export function collectValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string" || k.startsWith("$ACTION") || SENSITIVE.test(k)) continue;
    out[k] = v;
  }
  return out;
}
