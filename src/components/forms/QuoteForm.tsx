"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCategories, leadSchema, type LeadInput } from "@/schemas/lead";
import { MAX_FILES, MAX_TOTAL_BYTES, mergeFiles } from "@/lib/uploads";
import { buildWaLink } from "@/lib/contact";
import { cn } from "@/lib/utils/cn";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; protocol: string; attachmentsFailed?: number }
  | { kind: "error"; message: string };

type ApiBody = {
  protocol?: string;
  error?: string;
  fields?: Record<string, string>;
  message?: string;
  attachmentsFailed?: number;
};

const REQUEST_TIMEOUT_MS = 30_000;
const field =
  "bg-ink-2 w-full border px-4 py-3 text-white placeholder:text-white/30 focus:border-flame focus:outline-none";
const label = "mb-2 block font-mono text-xs tracking-widest uppercase";

type Props = { defaultCategory?: string; whatsapp: string };

export function QuoteForm({ defaultCategory, whatsapp }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [files, setFiles] = useState<File[]>([]);
  const [fileProblems, setFileProblems] = useState<string[]>([]);
  // chave única da tentativa: reenvios (queda de conexão, timeout) nunca duplicam o orçamento
  const attemptKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const initial = leadCategories.find((c) => c === defaultCategory);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: initial ? { category: initial } : undefined,
  });

  // Avisa antes de sair da página com dados preenchidos e ainda não enviados.
  const unsaved = (isDirty || files.length > 0) && status.kind !== "done";
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const onFiles = (list: FileList | null, input: HTMLInputElement) => {
    const { files: next, problems } = mergeFiles(files, Array.from(list ?? []));
    setFiles(next);
    setFileProblems(problems);
    input.value = ""; // permite escolher o mesmo arquivo de novo depois de removê-lo
  };

  const send = async (data: LeadInput) => {
    if (inFlight.current) return; // bloqueia envio duplicado (duplo clique / Enter repetido)
    inFlight.current = true;
    setStatus({ kind: "sending" });
    attemptKey.current ??= crypto.randomUUID();

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const body = new FormData();
      Object.entries(data).forEach(([k, v]) => v != null && v !== "" && body.append(k, String(v)));
      body.append("idempotencyKey", attemptKey.current);
      files.forEach((f) => body.append("references", f));

      const res = await fetch("/api/leads", { method: "POST", body, signal: controller.signal });
      const json = (await res.json().catch(() => ({}))) as ApiBody;

      if (res.ok && json.protocol) {
        setStatus({
          kind: "done",
          protocol: json.protocol,
          attachmentsFailed: json.attachmentsFailed,
        });
        return;
      }
      if (res.status === 422 && json.fields) {
        // erros apontados pelo servidor aparecem junto dos campos; nada é apagado
        Object.entries(json.fields).forEach(([name, message]) =>
          setError(name as keyof LeadInput, { type: "server", message }),
        );
        const first = Object.keys(json.fields)[0] as keyof LeadInput | undefined;
        if (first) setFocus(first);
        setStatus({
          kind: "error",
          message: "Corrija os campos destacados e envie novamente. Seus dados foram mantidos.",
        });
        return;
      }
      if (res.status === 422 && json.error === "invalid_files") {
        setFileProblems([json.message ?? "Verifique os anexos."]);
        setStatus({
          kind: "error",
          message: "Não foi possível enviar os anexos. Seus dados foram mantidos.",
        });
        return;
      }
      setStatus({
        kind: "error",
        message:
          res.status === 503
            ? "O recebimento de orçamentos pelo site não está disponível agora. Seus dados foram mantidos; tente novamente mais tarde ou use o WhatsApp."
            : res.status === 429
              ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e envie novamente; seus dados foram mantidos."
              : "O servidor teve um problema ao receber seu pedido. Seus dados foram mantidos; tente novamente.",
      });
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setStatus({
        kind: "error",
        message: aborted
          ? "O envio demorou demais. Seus dados foram mantidos; confira sua conexão e tente novamente (não há risco de duplicar o pedido)."
          : "Sem conexão com o servidor. Seus dados foram mantidos; confira sua internet e tente novamente (não há risco de duplicar o pedido).",
      });
    } finally {
      window.clearTimeout(timer);
      inFlight.current = false;
    }
  };

  const sending = status.kind === "sending";

  if (status.kind === "done") {
    const link = buildWaLink(
      whatsapp,
      `Olá! Enviei um orçamento pelo site. Protocolo ${status.protocol}.`,
    );
    return (
      <div role="status" className="border-flame/50 border p-8">
        <p className="text-flame font-mono text-xs tracking-widest uppercase">
          Solicitação recebida
        </p>
        <p className="font-display mt-3 text-3xl font-bold">{status.protocol}</p>
        <p className="text-steel mt-4">Guarde este número de protocolo.</p>
        {status.attachmentsFailed ? (
          <p role="alert" className="mt-4 text-sm text-yellow-300">
            Seu pedido foi salvo, mas {status.attachmentsFailed} anexo(s) não puderam ser enviados.
            Informe o protocolo e envie os arquivos pelo WhatsApp.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-6">
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-flame-soft underline"
            >
              Continuar pelo WhatsApp
            </a>
          )}
          <button
            type="button"
            className="text-steel underline"
            onClick={() => {
              // só aqui o formulário é limpo: depois da confirmação de sucesso e por escolha do usuário
              reset(initial ? { category: initial } : undefined);
              setFiles([]);
              setFileProblems([]);
              attemptKey.current = null;
              setStatus({ kind: "idle" });
            }}
          >
            Enviar outro orçamento
          </button>
        </div>
      </div>
    );
  }

  const bad = (k: keyof LeadInput) => !!errors[k];
  const err = (k: keyof LeadInput) =>
    errors[k] && (
      <p id={`${k}-erro`} role="alert" className="mt-1 text-sm text-red-400">
        {errors[k]?.message as string}
      </p>
    );
  const aria = (k: keyof LeadInput) => ({
    "aria-invalid": bad(k) ? true : undefined,
    "aria-describedby": bad(k) ? `${k}-erro` : undefined,
  });
  const cls = (k: keyof LeadInput) => cn(field, bad(k) ? "border-red-500" : "border-white/15");

  const fallbackHref =
    status.kind === "error"
      ? buildWaLink(
          whatsapp,
          `Olá! Gostaria de um orçamento.\nNome: ${getValues("name") ?? ""}\nServiço: ${getValues("category") ?? ""}\nProjeto: ${getValues("description") ?? ""}`,
        )
      : null;
  const totalMB = (files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(1);

  return (
    <form
      onSubmit={(e) => void handleSubmit(send)(e)}
      noValidate
      className="grid gap-5 sm:grid-cols-2"
      aria-busy={sending}
    >
      <label className="block">
        <span className={label}>Nome</span>
        <input
          className={cls("name")}
          autoComplete="name"
          disabled={sending}
          {...aria("name")}
          {...register("name")}
        />
        {err("name")}
      </label>
      <label className="block">
        <span className={label}>Empresa ou marca</span>
        <input
          className={cls("company")}
          autoComplete="organization"
          disabled={sending}
          {...aria("company")}
          {...register("company")}
        />
        {err("company")}
      </label>
      <label className="block">
        <span className={label}>WhatsApp</span>
        <input
          className={cls("whatsapp")}
          type="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          disabled={sending}
          {...aria("whatsapp")}
          {...register("whatsapp")}
        />
        {err("whatsapp")}
      </label>
      <label className="block">
        <span className={label}>E-mail</span>
        <input
          className={cls("email")}
          type="email"
          autoComplete="email"
          disabled={sending}
          {...aria("email")}
          {...register("email")}
        />
        {err("email")}
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Serviço desejado</span>
        <select
          className={cls("category")}
          defaultValue={initial ?? ""}
          disabled={sending}
          {...aria("category")}
          {...register("category")}
        >
          <option value="" disabled>
            Selecione
          </option>
          {leadCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {err("category")}
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Descrição do projeto</span>
        <textarea
          rows={5}
          className={cls("description")}
          disabled={sending}
          {...aria("description")}
          {...register("description")}
        />
        {err("description")}
      </label>
      <label className="block">
        <span className={label}>Prazo</span>
        <input
          className={cls("deadline")}
          placeholder="Ex.: evento em 15/12"
          disabled={sending}
          {...aria("deadline")}
          {...register("deadline")}
        />
        {err("deadline")}
      </label>
      <label className="block">
        <span className={label}>Faixa de investimento (opcional)</span>
        <input
          className={cls("budget")}
          disabled={sending}
          {...aria("budget")}
          {...register("budget")}
        />
        {err("budget")}
      </label>

      <div className="sm:col-span-2">
        <label className="block">
          <span className={label}>Referências (opcional)</span>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={sending}
            onChange={(e) => onFiles(e.target.files, e.target)}
            aria-describedby="refs-ajuda"
            className="text-steel file:bg-ink-3 file:mr-4 file:border-0 file:px-4 file:py-2 file:text-white"
          />
        </label>
        <p id="refs-ajuda" className="text-steel mt-1 text-sm">
          Até {MAX_FILES} arquivos (PNG, JPG, WebP ou PDF), somando até{" "}
          {MAX_TOTAL_BYTES / 1024 / 1024} MB. Se você recarregar ou fechar a página, será preciso
          anexar os arquivos de novo.
        </p>
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm" aria-label="Arquivos selecionados">
            {files.map((f) => (
              <li
                key={`${f.name}-${f.size}-${f.lastModified}`}
                className="flex items-center justify-between gap-4 border border-white/10 px-3 py-2"
              >
                <span className="truncate">
                  {f.name}{" "}
                  <span className="text-steel">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                </span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setFiles((cur) => cur.filter((x) => x !== f))}
                  className="font-mono text-xs tracking-widest text-red-400 uppercase hover:underline"
                  aria-label={`Remover ${f.name}`}
                >
                  Remover
                </button>
              </li>
            ))}
            <li className="text-steel text-xs">Total: {totalMB} MB</li>
          </ul>
        )}
        {fileProblems.length > 0 && (
          <ul role="alert" className="mt-2 space-y-1 text-sm text-red-400">
            {fileProblems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>

      {/* isca anti-robô */}
      <div aria-hidden className="absolute -left-[9999px]">
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={sending}
          className="bg-flame text-ink hover:bg-flame-soft w-full px-7 py-4 font-mono text-xs font-medium tracking-[0.18em] uppercase transition-colors disabled:opacity-60 sm:w-fit"
        >
          {sending
            ? "Enviando…"
            : status.kind === "error"
              ? "Tentar enviar novamente"
              : "Solicitar um orçamento"}
        </button>
        {status.kind === "error" && (
          <p role="alert" className="text-red-400">
            {status.message}{" "}
            {fallbackHref && (
              <a
                className="text-flame-soft underline"
                href={fallbackHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar pelo WhatsApp
              </a>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
