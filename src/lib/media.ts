/**
 * Regras de mídia do painel (upload direto ao Supabase Storage).
 * Os mesmos limites estão no bucket (migração 0003): o Storage recusa arquivos fora deles
 * mesmo que o navegador mande valores falsos.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** 50 MB = teto do plano gratuito do Supabase. Em plano pago, aumente aqui e na migração. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/x-icon"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

type FileLike = { size: number; type: string };

/** Mensagem de erro, ou null se o arquivo é aceitável. SVG é proibido de propósito. */
export function validateMedia(file: FileLike, allowVideo: boolean): string | null {
  if (IMAGE_TYPES.includes(file.type)) {
    return file.size > MAX_IMAGE_BYTES
      ? `Imagem acima de ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`
      : null;
  }
  if (allowVideo && VIDEO_TYPES.includes(file.type)) {
    return file.size > MAX_VIDEO_BYTES
      ? `Vídeo acima de ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`
      : null;
  }
  return allowVideo
    ? "Formato não permitido (use PNG, JPG, WebP, GIF, MP4 ou WebM)."
    : "Formato não permitido (use PNG, JPG, WebP ou GIF).";
}

const PUBLIC_SEGMENT = "/storage/v1/object/public/media/";

/** Prefixo das URLs públicas do bucket `media` neste projeto Supabase. */
export function mediaPublicPrefix(supabaseUrl: string | undefined): string {
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}${PUBLIC_SEGMENT}` : "";
}

/** Caminho do objeto dentro do bucket, a partir da URL pública (null se não for do bucket). */
export function mediaPathFromUrl(url: string, prefix: string): string | null {
  if (!prefix || !url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0]);
  return path && !path.includes("..") ? path : null;
}

export const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
