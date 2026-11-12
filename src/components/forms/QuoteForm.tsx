"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCategories, leadSchema, type LeadInput } from "@/schemas/lead";
import { MAX_FILES, MAX_FILE_BYTES, validateFiles } from "@/lib/uploads";
import { buildWaLink } from "@/lib/contact";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; protocol: string }
  | { kind: "error"; message: string };

const field =
  "bg-ink-2 w-full border border-white/15 px-4 py-3 text-white placeholder:text-white/30 focus:border-flame focus:outline-none";
const label = "mb-2 block font-mono text-xs tracking-widest uppercase";

type Props = { defaultCategory?: string; whatsapp: string };

export function QuoteForm({ defaultCategory, whatsapp }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const initial = leadCategories.find((c) => c === defaultCategory);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: initial ? { category: initial } : undefined,
  });

  const onFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const problem = validateFiles(picked);
    setFileError(problem);
    setFiles(problem ? [] : picked);
  };

  const onSubmit = async (data: LeadInput) => {
    setStatus({ kind: "sending" });
    try {
      const body = new FormData();
      Object.entries(data).forEach(([k, v]) => v != null && body.append(k, String(v)));
      files.forEach((f) => body.append("references", f));
      const res = await fetch("/api/leads", { method: "POST", body });
      const json = (await res.json()) as { protocol?: string };
      if (res.ok && json.protocol) setStatus({ kind: "done", protocol: json.protocol });
      else
        setStatus({
          kind: "error",
          message:
            res.status === 503
              ? "O recebimento de orçamentos pelo site ainda não está ativo."
              : res.status === 429
                ? "Muitas tentativas. Aguarde alguns minutos."
                : "Não foi possível enviar agora. Tente novamente.",
        });
    } catch {
      setStatus({ kind: "error", message: "Sem conexão. Tente novamente." });
    }
  };

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
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-flame-soft mt-6 inline-block underline"
          >
            Continuar pelo WhatsApp
          </a>
        )}
      </div>
    );
  }

  const err = (k: keyof LeadInput) =>
    errors[k] && (
      <p id={`${k}-erro`} className="mt-1 text-sm text-red-400">
        {errors[k]?.message as string}
      </p>
    );
  const aria = (k: keyof LeadInput) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-erro` : undefined,
  });

  const fallbackHref =
    status.kind === "error"
      ? buildWaLink(
          whatsapp,
          `Olá! Gostaria de um orçamento.\nNome: ${getValues("name")}\nServiço: ${getValues("category")}\nProjeto: ${getValues("description")}`,
        )
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className={label}>Nome</span>
        <input className={field} autoComplete="name" {...aria("name")} {...register("name")} />
        {err("name")}
      </label>
      <label className="block">
        <span className={label}>Empresa ou marca</span>
        <input className={field} autoComplete="organization" {...register("company")} />
      </label>
      <label className="block">
        <span className={label}>WhatsApp</span>
        <input
          className={field}
          type="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          {...aria("whatsapp")}
          {...register("whatsapp")}
        />
        {err("whatsapp")}
      </label>
      <label className="block">
        <span className={label}>E-mail</span>
        <input
          className={field}
          type="email"
          autoComplete="email"
          {...aria("email")}
          {...register("email")}
        />
        {err("email")}
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Serviço desejado</span>
        <select
          className={field}
          defaultValue={initial ?? ""}
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
          className={field}
          {...aria("description")}
          {...register("description")}
        />
        {err("description")}
      </label>
      <label className="block">
        <span className={label}>Prazo</span>
        <input className={field} placeholder="Ex.: evento em 15/12" {...register("deadline")} />
      </label>
      <label className="block">
        <span className={label}>Faixa de investimento (opcional)</span>
        <input className={field} {...register("budget")} />
      </label>
      <label className="block sm:col-span-2">
        <span className={label}>Referências (opcional)</span>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => onFiles(e.target.files)}
          aria-describedby="refs-ajuda"
          className="text-steel file:bg-ink-3 file:mr-4 file:border-0 file:px-4 file:py-2 file:text-white"
        />
        <p id="refs-ajuda" className="text-steel mt-1 text-sm">
          Até {MAX_FILES} arquivos (PNG, JPG, WebP ou PDF) de {MAX_FILE_BYTES / 1024 / 1024} MB.
        </p>
        {fileError && <p className="mt-1 text-sm text-red-400">{fileError}</p>}
      </label>

      {/* isca anti-robô */}
      <div aria-hidden className="absolute -left-[9999px]">
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="bg-flame text-ink hover:bg-flame-soft w-full px-7 py-4 font-mono text-xs font-medium tracking-[0.18em] uppercase transition-colors disabled:opacity-60 sm:w-fit"
        >
          {status.kind === "sending" ? "Enviando…" : "Solicitar um orçamento"}
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
