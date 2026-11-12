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

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  company: z.string().trim().optional(),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe um WhatsApp com DDD"),
  email: z.string().trim().email("E-mail inválido"),
  category: z.enum(leadCategories, { message: "Escolha um serviço" }),
  description: z.string().trim().min(20, "Descreva o projeto com um pouco mais de detalhe"),
  deadline: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  /** Campo isca contra robôs: deve permanecer vazio. */
  website: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
