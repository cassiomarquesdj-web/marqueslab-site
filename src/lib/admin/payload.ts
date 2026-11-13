import type { Resource } from "@/lib/admin/resources";
import { slugify } from "@/lib/utils/slug";

type Get = (name: string) => FormDataEntryValue | null;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Converte o formulário em um objeto pronto para gravar, validando por tipo de campo.
 * Campos de imagem não são tratados aqui (dependem de upload): só preservam o valor atual.
 */
export function buildPayload(
  resource: Resource,
  get: Get,
  isCreate: boolean,
  opts: { mediaPrefix?: string } = {},
): { payload: Record<string, unknown>; error?: string } {
  const payload: Record<string, unknown> = {};
  const text = (n: string) => {
    const v = get(n);
    return typeof v === "string" ? v.trim() : "";
  };

  for (const f of resource.fields) {
    if (f.createOnly && !isCreate) continue;
    let value: unknown;

    switch (f.type) {
      case "number": {
        const n = Number(text(f.name));
        value = Number.isFinite(n) ? Math.trunc(n) : 0;
        break;
      }
      case "boolean":
        value = get(f.name) === "on";
        break;
      case "select": {
        const v = text(f.name) || f.options?.[0]?.value || "";
        if (f.options && !f.options.some((o) => o.value === v)) {
          return { payload, error: `Valor inválido em “${f.label}”.` };
        }
        value = v;
        break;
      }
      case "tags":
        value = text(f.name)
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "json": {
        const raw = text(f.name);
        if (!raw) {
          value = [];
          break;
        }
        try {
          const parsed: unknown = JSON.parse(raw);
          if (!Array.isArray(parsed)) throw new Error("not array");
          value = parsed;
        } catch {
          return { payload, error: `“${f.label}” precisa ser uma lista JSON válida.` };
        }
        break;
      }
      case "image": {
        const current = text(`${f.name}__current`);
        // Só aceita arquivos do nosso bucket de mídia (impede URLs arbitrárias nos campos de imagem).
        if (current && (!opts.mediaPrefix || !current.startsWith(opts.mediaPrefix))) {
          return { payload, error: `Arquivo inválido em “${f.label}”. Envie novamente.` };
        }
        value = current || null;
        break;
      }
      default: {
        let v = text(f.name);
        if (f.name === "slug") {
          if (!v && f.slugFrom) v = slugify(text(f.slugFrom));
          else v = slugify(v);
          if (!SLUG_RE.test(v)) return { payload, error: "Informe um slug válido." };
        }
        value = v === "" ? null : v;
        if (f.type === "url" && typeof value === "string" && !/^https?:\/\//.test(value)) {
          return { payload, error: `“${f.label}” precisa começar com http:// ou https://.` };
        }
      }
    }

    if (f.required && (value === null || value === "")) {
      // imagens obrigatórias podem ser satisfeitas pelo upload; o chamador revalida.
      if (f.type !== "image") return { payload, error: `Preencha “${f.label}”.` };
    }
    payload[f.name] = value;
  }
  return { payload };
}
