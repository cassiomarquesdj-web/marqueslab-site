export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

type FileLike = { name: string; size: number; type: string };

/** Retorna uma mensagem de erro, ou null se os arquivos são aceitáveis. */
export function validateFiles(files: FileLike[]): string | null {
  if (files.length > MAX_FILES) return `Envie no máximo ${MAX_FILES} arquivos.`;
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) return `"${f.name}": formato não permitido.`;
    if (f.size > MAX_FILE_BYTES) return `"${f.name}" passa de ${MAX_FILE_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}
