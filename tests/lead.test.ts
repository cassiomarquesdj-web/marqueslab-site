import { describe, expect, it } from "vitest";
import { leadSchema } from "../src/schemas/lead";
import { departments } from "../src/lib/departments";
import { leadCategories } from "../src/schemas/lead";

const valid = {
  name: "Maria",
  whatsapp: "(91) 99999-9999",
  email: "maria@exemplo.com",
  category: "Motion",
  description: "Preciso de uma abertura animada para um evento.",
};

describe("leadSchema", () => {
  it("aceita um orçamento válido", () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });
  it("rejeita e-mail, WhatsApp e descrição inválidos", () => {
    const r = leadSchema.safeParse({ ...valid, email: "x", whatsapp: "123", description: "curta" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.length).toBe(3);
  });
  it("rejeita categoria desconhecida", () => {
    expect(leadSchema.safeParse({ ...valid, category: "Outra" }).success).toBe(false);
  });
});

describe("departments", () => {
  it("cada categoria de departamento existe no orçamento", () => {
    for (const d of departments) expect(leadCategories).toContain(d.category);
  });
});
