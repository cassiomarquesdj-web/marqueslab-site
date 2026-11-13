import { z } from "zod";

export const leadCategories = [
  "Design",
  "Branding",
  "Motion",
  "Audiovisual",
  "LED Visual",
  "Eventos",
  "Marketing",
  "Tecnologia",
  "Outros",
] as const;

/** Telefone brasileiro com DDD, com ou sem +55: de 10 a 13 dígitos. */
export const isValidPhone = (v: string) => {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13 && /^[\d\s()+.-]+$/.test(v);
};

// Os limites de tamanho espelham os `check` do banco: um valor aceito aqui nunca vira erro 500.
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120, "Nome muito longo (máx. 120)"),
  company: z.string().trim().max(120, "Máximo de 120 caracteres").optional(),
  whatsapp: z
    .string()
    .trim()
    .refine(isValidPhone, "Informe um WhatsApp válido com DDD, ex.: (91) 99999-9999"),
  email: z.string().trim().max(160, "E-mail muito longo").email("Informe um e-mail válido"),
  category: z.enum(leadCategories, { message: "Escolha um serviço" }),
  description: z
    .string()
    .trim()
    .min(20, "Descreva o projeto com um pouco mais de detalhe (mín. 20 caracteres)")
    .max(5000, "Descrição muito longa (máx. 5000 caracteres)"),
  deadline: z.string().trim().max(120, "Máximo de 120 caracteres").optional(),
  budget: z.string().trim().max(120, "Máximo de 120 caracteres").optional(),
  /** Chave única da tentativa de envio (evita duplicidade em reenvios). */
  idempotencyKey: z.string().uuid().optional(),
  /** Campo isca contra robôs: deve permanecer vazio. */
  website: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Converte os problemas do Zod em { campo: mensagem } (primeira mensagem de cada campo). */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !(key in out)) out[key] = i.message;
  }
  return out;
}
