"use client";

import { useRef, useState } from "react";
import { createUploadUrl, discardUpload } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, validateMedia } from "@/lib/media";

type Props = {
  /** nome do campo no formulário que recebe a URL final */
  inputName: string;
  /** recurso (ou "configuracoes") e campo, usados pelo servidor para autorizar o envio */
  resourceKey: string;
  fieldName: string;
  current: string;
  allowVideo: boolean;
  label: string;
};

type State =
  { kind: "idle" } | { kind: "uploading"; name: string } | { kind: "error"; message: string };

const isVideo = (url: string) => /\.(mp4|webm)(\?|$)/i.test(url);

/**
 * Envia o arquivo direto do navegador ao Supabase Storage com uma URL assinada, sem passar pelo
 * servidor (sem o limite de corpo da Vercel). O formulário só recebe a URL pública resultante.
 */
export function MediaUpload({
  inputName,
  resourceKey,
  fieldName,
  current,
  allowVideo,
  label,
}: Props) {
  const [url, setUrl] = useState(current);
  const [state, setState] = useState<State>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  // arquivos enviados nesta edição e ainda não salvos: se forem trocados/removidos, são descartados
  const sessionUploads = useRef(new Set<string>());

  const discardIfUnsaved = (oldUrl: string) => {
    if (!oldUrl || !sessionUploads.current.has(oldUrl)) return;
    sessionUploads.current.delete(oldUrl);
    void discardUpload(resourceKey, fieldName, oldUrl).catch(() => {});
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateMedia(file, allowVideo);
    if (problem) return setState({ kind: "error", message: problem });

    setState({ kind: "uploading", name: file.name });
    try {
      const grant = await createUploadUrl(resourceKey, fieldName, file.name, file.size, file.type);
      if (!grant.ok) return setState({ kind: "error", message: grant.error });

      const storage = createClient().storage.from("media");
      const { error } = await storage.uploadToSignedUrl(grant.path, grant.token, file, {
        contentType: file.type,
      });
      if (error) return setState({ kind: "error", message: "Falha no envio. Tente novamente." });

      const next = storage.getPublicUrl(grant.path).data.publicUrl;
      discardIfUnsaved(url);
      sessionUploads.current.add(next);
      setUrl(next);
      setState({ kind: "idle" });
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      // queda de conexão: o arquivo anterior e o restante do formulário continuam como estavam
      setState({
        kind: "error",
        message: "Sem conexão. O envio não foi concluído; tente novamente.",
      });
    }
  };

  const limit = allowVideo
    ? `imagens até ${MAX_IMAGE_BYTES / 1024 / 1024} MB, vídeos até ${MAX_VIDEO_BYTES / 1024 / 1024} MB`
    : `até ${MAX_IMAGE_BYTES / 1024 / 1024} MB`;

  return (
    <div className="space-y-2">
      {url &&
        (isVideo(url) ? (
          <video
            src={url}
            controls
            preload="metadata"
            className="bg-ink-3 h-32 w-auto border border-white/10"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="bg-ink-3 h-24 w-auto border border-white/10" />
        ))}
      <input type="hidden" name={inputName} value={url} />
      <input
        ref={fileRef}
        type="file"
        aria-label={label}
        accept={allowVideo ? "image/*,video/mp4,video/webm" : "image/*"}
        disabled={state.kind === "uploading"}
        onChange={(e) => onPick(e.target.files?.[0])}
        className="text-steel file:bg-ink-3 file:mr-3 file:border-0 file:px-3 file:py-2 file:text-white"
      />
      <p className="text-steel text-xs">
        Formatos: PNG, JPG, WebP, GIF{allowVideo ? ", MP4, WebM" : ""} ({limit}).
      </p>
      {state.kind === "uploading" && (
        <p role="status" className="text-flame-soft text-sm">
          Enviando {state.name}… aguarde antes de salvar.
        </p>
      )}
      {state.kind === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      {url && state.kind !== "uploading" && (
        <button
          type="button"
          onClick={() => {
            discardIfUnsaved(url);
            setUrl("");
          }}
          className="font-mono text-xs tracking-widest text-red-400 uppercase hover:underline"
        >
          Remover arquivo
        </button>
      )}
    </div>
  );
}
