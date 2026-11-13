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

type Pickable = FileLike & { lastModified: number };

/**
 * Soma novos arquivos à seleção atual, recusando um a um os que não servem (formato, duplicado,
 * limite de quantidade ou de tamanho) e explicando cada recusa. A seleção válida anterior nunca é perdida.
 */
export function mergeFiles<T extends Pickable>(
  current: T[],
  incoming: T[],
): { files: T[]; problems: string[] } {
  const files = [...current];
  const problems: string[] = [];
  for (const f of incoming) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      problems.push(`"${f.name}": formato não permitido (use PNG, JPG, WebP ou PDF).`);
    } else if (
      files.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)
    ) {
      problems.push(`"${f.name}" já foi adicionado.`);
    } else if (files.length >= MAX_FILES) {
      problems.push(`"${f.name}": limite de ${MAX_FILES} arquivos atingido.`);
    } else if (files.reduce((n, x) => n + x.size, 0) + f.size > MAX_TOTAL_BYTES) {
      problems.push(
        `"${f.name}": passaria do limite de ${MAX_TOTAL_BYTES / 1024 / 1024} MB no total.`,
      );
    } else {
      files.push(f);
    }
  }
  return { files, problems };
}
