import { describe, expect, it } from "vitest";
import { nav, site } from "../src/lib/site";

describe("site config", () => {
  it("expõe as rotas principais", () => {
    expect(nav.map((n) => n.href)).toEqual([
      "/",
      "/servicos",
      "/portfolio",
      "/sobre",
      "/tecnologia",
      "/contato",
    ]);
  });
  it("usa o domínio oficial por padrão", () => {
    expect(site.url).toContain("marqueslab");
  });
});
