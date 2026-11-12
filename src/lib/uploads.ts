export const MAX_FILES = 5;
/** A Vercel limita o corpo de requisições de funções a ~4,5 MB: o total precisa caber nisso. */
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

type FileLike = { name: string; size: number; type: string };

/** Retorna uma mensagem de erro, ou null se os arquivos são aceitáveis. */
export function validateFiles(files: FileLike[]): string | null {
  if (files.length > MAX_FILES) return `Envie no máximo ${MAX_FILES} arquivos.`;
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) return `"${f.name}": formato não permitido.`;
  }
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > MAX_TOTAL_BYTES)
    return `Os arquivos somam mais de ${MAX_TOTAL_BYTES / 1024 / 1024} MB.`;
  return null;
}
