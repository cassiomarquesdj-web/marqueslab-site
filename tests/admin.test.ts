import { describe, expect, it } from "vitest";
import { buildPayload } from "../src/lib/admin/payload";
import { getResource, resources, sections } from "../src/lib/admin/resources";
import { toCsv, csvCell } from "../src/lib/csv";
import { rateLimit } from "../src/lib/rate-limit";
import { validateFiles } from "../src/lib/uploads";
import { slugify } from "../src/lib/utils/slug";
import { buildWaLink } from "../src/lib/contact";

const form = (o: Record<string, string>) => (n: string) => o[n] ?? null;

describe("buildPayload", () => {
  const projects = getResource("projetos")!;

  it("gera slug a partir do título e converte tipos", () => {
    const { payload, error } = buildPayload(
      projects,
      form({ title: "Abertura Cinematográfica", status: "published", featured: "on", sort: "3" }),
      true,
    );
    expect(error).toBeUndefined();
    expect(payload.slug).toBe("abertura-cinematografica");
    expect(payload.featured).toBe(true);
    expect(payload.show_client).toBe(false);
    expect(payload.sort).toBe(3);
  });

  it("exige título e rejeita status inválido", () => {
    expect(buildPayload(projects, form({ title: "" }), true).error).toBeTruthy();
    expect(buildPayload(projects, form({ title: "X", status: "hack" }), true).error).toBeTruthy();
  });

  it("valida JSON de benefícios", () => {
    const services = getResource("servicos")!;
    const base = { name: "Motion", category: "Motion" };
    expect(buildPayload(services, form({ ...base, benefits: "{oops" }), true).error).toBeTruthy();
    const ok = buildPayload(
      services,
      form({ ...base, benefits: '[{"title":"a","text":"b"}]' }),
      true,
    );
    expect(ok.error).toBeUndefined();
    expect(ok.payload.benefits).toEqual([{ title: "a", text: "b" }]);
  });

  it("não altera campos createOnly na edição", () => {
    const banners = getResource("banners")!;
    const { payload } = buildPayload(banners, form({ key: "outro" }), false);
    expect("key" in payload).toBe(false);
  });

  it("rejeita URL de vídeo sem http(s)", () => {
    expect(
      buildPayload(projects, form({ title: "X", video_url: "javascript:alert(1)" }), true).error,
    ).toBeTruthy();
  });
});

describe("recursos e permissões", () => {
  it("chaves únicas e campos coerentes", () => {
    const keys = resources.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of resources) {
      expect(r.fields.some((f) => f.name === r.titleField) || r.titleField === "caption").toBe(
        true,
      );
      for (const rel of r.related ?? []) expect(getResource(rel.resource)).toBeTruthy();
    }
  });
  it("editor não acessa orçamentos e vendas não edita conteúdo", () => {
    const leads = sections.find((s) => s.href === "/admin/orcamentos")!;
    expect(leads.roles).not.toContain("editor");
    expect(getResource("projetos")!.roles).not.toContain("sales");
    expect(sections.find((s) => s.href === "/admin/usuarios")!.roles).toEqual(["admin"]);
  });
});

describe("csv", () => {
  it("escapa aspas e neutraliza fórmulas", () => {
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(null)).toBe("");
  });
  it("gera cabeçalho e linhas", () => {
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toContain('a,b\r\n1,"x,y"');
  });
});

describe("utilitários", () => {
  it("limita requisições por janela", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t)).toBe(true);
    expect(rateLimit("k", 3, 1000, t)).toBe(false);
    expect(rateLimit("k", 3, 1000, t + 2000)).toBe(true);
  });
  it("valida anexos", () => {
    expect(validateFiles([{ name: "a.png", size: 100, type: "image/png" }])).toBeNull();
    expect(
      validateFiles([{ name: "a.exe", size: 100, type: "application/x-msdownload" }]),
    ).toBeTruthy();
    expect(
      validateFiles([{ name: "a.pdf", size: 99_000_000, type: "application/pdf" }]),
    ).toBeTruthy();
  });
  it("slugify remove acentos", () => {
    expect(slugify("Direção de Arte!")).toBe("direcao-de-arte");
  });
  it("buildWaLink exige número válido", () => {
    expect(buildWaLink("", "oi")).toBeNull();
    expect(buildWaLink("+55 (91) 99999-9999", "oi")).toBe("https://wa.me/5591999999999?text=oi");
  });
});
