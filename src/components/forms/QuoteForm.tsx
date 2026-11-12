"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadCategories, leadSchema, type LeadInput } from "@/schemas/lead";
import { hasWhatsapp, waLink } from "@/lib/contact";
import { cn } from "@/lib/utils/cn";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; protocol: string }
  | { kind: "error"; message: string };

const field =
  "bg-ink-2 w-full border border-white/15 px-4 py-3 text-white placeholder:text-white/30 focus:border-flame focus:outline-none";

export function QuoteForm({ defaultCategory }: { defaultCategory?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
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

  const onSubmit = async (data: LeadInput) => {
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { protocol?: string; error?: string };
      if (res.ok && json.protocol) setStatus({ kind: "done", protocol: json.protocol });
      else
        setStatus({
          kind: "error",
          message:
            res.status === 503
              ? "O recebimento de orçamentos pelo site ainda não está ativo."
              : "Não foi possível enviar agora. Tente novamente.",
        });
    } catch {
      setStatus({ kind: "error", message: "Sem conexão. Tente novamente." });
    }
  };

  if (status.kind === "done") {
    const link = waLink(`Olá! Enviei um orçamento pelo site. Protocolo ${status.protocol}.`);
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

  const whatsappFallback = () => {
    const v = getValues();
    return waLink(
      `Olá! Gostaria de um orçamento.\nNome: ${v.name}\nServiço: ${v.category}\nProjeto: ${v.description}`,
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">Nome</span>
        <input className={field} autoComplete="name" {...aria("name")} {...register("name")} />
        {err("name")}
      </label>
      <label className="block">
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">
          Empresa ou marca
        </span>
        <input className={field} autoComplete="organization" {...register("company")} />
      </label>
      <label className="block">
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">WhatsApp</span>
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
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">E-mail</span>
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
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">
          Serviço desejado
        </span>
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
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">
          Descrição do projeto
        </span>
        <textarea
          rows={5}
          className={field}
          {...aria("description")}
          {...register("description")}
        />
        {err("description")}
      </label>
      <label className="block">
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">Prazo</span>
        <input className={field} placeholder="Ex.: evento em 15/12" {...register("deadline")} />
      </label>
      <label className="block">
        <span className="mb-2 block font-mono text-xs tracking-widest uppercase">
          Faixa de investimento (opcional)
        </span>
        <input className={field} {...register("budget")} />
      </label>

      {/* isca anti-robô */}
      <div aria-hidden className="absolute -left-[9999px]">
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="flex flex-col gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className={cn(
            "bg-flame text-ink hover:bg-flame-soft w-full px-7 py-4 font-mono text-xs font-medium tracking-[0.18em] uppercase transition-colors disabled:opacity-60 sm:w-fit",
          )}
        >
          {status.kind === "sending" ? "Enviando…" : "Solicitar um orçamento"}
        </button>
        {status.kind === "error" && (
          <p role="alert" className="text-red-400">
            {status.message}{" "}
            {hasWhatsapp && (
              <a
                className="text-flame-soft underline"
                href={whatsappFallback() ?? "#"}
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
