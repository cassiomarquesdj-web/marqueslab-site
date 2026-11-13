import { describe, expect, it } from "vitest";
import { fieldErrorsFrom, isValidPhone, leadSchema } from "../src/schemas/lead";
import { MAX_FILES, MAX_TOTAL_BYTES, mergeFiles } from "../src/lib/uploads";
import { collectValues } from "../src/lib/admin/form-state";
import { buildPayload } from "../src/lib/admin/payload";
import { getResource } from "../src/lib/admin/resources";

const valid = {
  name: "Maria Silva",
  whatsapp: "(91) 99999-9999",
  email: "maria@exemplo.com",
  category: "Motion",
  description: "Preciso de uma abertura animada para um evento em dezembro.",
};

describe("validação do orçamento (campo a campo)", () => {
  const erros = (o: object) => {
    const r = leadSchema.safeParse({ ...valid, ...o });
    return r.success ? {} : fieldErrorsFrom(r.error.issues);
  };

  it("aceita um pedido válido", () => expect(erros({})).toEqual({}));
  it("campo obrigatório vazio → erro no campo certo, em português", () => {
    const e = erros({ name: "", description: "" });
    expect(e.name).toMatch(/nome/i);
    expect(e.description).toMatch(/Descreva/);
    expect(Object.keys(e).sort()).toEqual(["description", "name"]);
  });
  it("e-mail inválido", () => {
    for (const email of ["x", "a@b", "sem arroba.com", "a@@b.com"])
      expect(erros({ email }).email).toMatch(/e-mail/i);
  });
  it("telefone inválido e válidos", () => {
    for (const whatsapp of ["123", "abcdefghijk", "(91) 9999", "9".repeat(14)])
      expect(erros({ whatsapp }).whatsapp).toMatch(/WhatsApp/);
    for (const whatsapp of [
      "(91) 99999-9999",
      "91999999999",
      "+55 91 99999-9999",
      "(91) 3333-4444",
    ])
      expect(isValidPhone(whatsapp)).toBe(true);
  });
  it("categoria fora da lista e tamanhos acima do banco são recusados aqui (nunca viram erro 500)", () => {
    expect(erros({ category: "Hack" }).category).toMatch(/serviço/i);
    expect(erros({ name: "a".repeat(121) }).name).toBeTruthy();
    expect(erros({ description: "x".repeat(5001) }).description).toBeTruthy();
  });
  it("chave de idempotência precisa ser UUID", () => {
    expect(erros({ idempotencyKey: "nao-e-uuid" }).idempotencyKey).toBeTruthy();
    expect(erros({ idempotencyKey: crypto.randomUUID() })).toEqual({});
  });
});

describe("seleção de anexos", () => {
  const f = (name: string, type: string, size = 1000, lastModified = 1) => ({
    name,
    type,
    size,
    lastModified,
  });

  it("recusa formato não permitido SEM perder a seleção válida anterior", () => {
    const atual = [f("a.png", "image/png")];
    const r = mergeFiles(atual, [
      f("virus.exe", "application/x-msdownload"),
      f("b.pdf", "application/pdf"),
    ]);
    expect(r.files.map((x) => x.name)).toEqual(["a.png", "b.pdf"]);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toMatch(/virus\.exe.*formato não permitido/);
  });
  it("não duplica o mesmo arquivo", () => {
    const a = f("a.png", "image/png");
    const r = mergeFiles([a], [{ ...a }]);
    expect(r.files).toHaveLength(1);
    expect(r.problems[0]).toMatch(/já foi adicionado/);
  });
  it("respeita o máximo de arquivos e o tamanho total", () => {
    const cheio = Array.from({ length: MAX_FILES }, (_, i) => f(`${i}.png`, "image/png", 10, i));
    expect(mergeFiles(cheio, [f("extra.png", "image/png")]).problems[0]).toMatch(/limite/);
    const grande = mergeFiles(
      [f("a.png", "image/png", MAX_TOTAL_BYTES - 10)],
      [f("b.png", "image/png", 100, 2)],
    );
    expect(grande.files).toHaveLength(1);
    expect(grande.problems[0]).toMatch(/limite/);
  });
});

describe("estado devolvido aos formulários do painel", () => {
  it("devolve o que foi digitado, sem arquivos, senhas nem campos internos do React", () => {
    const fd = new FormData();
    fd.append("$ACTION_ID_abc", "x");
    fd.append("title", "Meu projeto");
    fd.append("featured", "on");
    fd.append("password", "segredo");
    fd.append("senha", "segredo");
    fd.append("cover", new File(["x"], "capa.png", { type: "image/png" }));
    expect(collectValues(fd)).toEqual({ title: "Meu projeto", featured: "on" });
  });
  it("erros de validação apontam o campo para ser exibido ao lado dele", () => {
    const servicos = getResource("servicos")!;
    const get = (n: string) =>
      ({ name: "Depto", category: "Motion", benefits: "{quebrado" })[n as "name"] ?? null;
    const r = buildPayload(servicos, get, true);
    expect(r.field).toBe("benefits");
    expect(r.error).toMatch(/JSON/);
    const vazio = buildPayload(getResource("projetos")!, () => null, true);
    expect(vazio.field).toBe("title");
  });
});
