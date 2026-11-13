import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaPathFromUrl,
  mediaPublicPrefix,
  safeFileName,
  validateMedia,
} from "../src/lib/media";
import { buildPayload } from "../src/lib/admin/payload";
import { getResource, resources } from "../src/lib/admin/resources";

const prefix = mediaPublicPrefix("https://abc.supabase.co/");
const form = (o: Record<string, string>) => (n: string) => o[n] ?? null;

describe("validateMedia", () => {
  it("aceita imagens até 10 MB e recusa acima", () => {
    expect(validateMedia({ size: 1000, type: "image/png" }, false)).toBeNull();
    expect(validateMedia({ size: MAX_IMAGE_BYTES + 1, type: "image/webp" }, false)).toMatch(
      /Imagem/,
    );
  });
  it("vídeo só quando permitido e até 50 MB", () => {
    expect(validateMedia({ size: 5_000_000, type: "video/mp4" }, true)).toBeNull();
    expect(validateMedia({ size: 5_000_000, type: "video/mp4" }, false)).toMatch(/Formato/);
    expect(validateMedia({ size: MAX_VIDEO_BYTES + 1, type: "video/webm" }, true)).toMatch(/Vídeo/);
  });
  it("recusa SVG, HTML e executáveis", () => {
    for (const type of ["image/svg+xml", "text/html", "application/x-msdownload"])
      expect(validateMedia({ size: 10, type }, true)).toMatch(/Formato/);
  });
});

describe("URLs de mídia", () => {
  it("monta o prefixo e extrai o caminho", () => {
    expect(prefix).toBe("https://abc.supabase.co/storage/v1/object/public/media/");
    expect(mediaPathFromUrl(`${prefix}projects/a-b.png`, prefix)).toBe("projects/a-b.png");
  });
  it("recusa URLs de fora do bucket e travessia de diretório", () => {
    expect(mediaPathFromUrl("https://evil.com/x.png", prefix)).toBeNull();
    expect(mediaPathFromUrl(`${prefix}../secrets`, prefix)).toBeNull();
    expect(mediaPathFromUrl(`${prefix}x.png`, "")).toBeNull();
  });
  it("higieniza nomes de arquivo", () => {
    expect(safeFileName("minha foto (1)?.png")).toBe("minha_foto__1__.png");
  });
});

describe("campos de imagem no payload", () => {
  const projects = getResource("projetos")!;
  it("aceita só URLs do bucket de mídia", () => {
    const ok = buildPayload(
      projects,
      form({ title: "X", cover_url__current: `${prefix}a.png` }),
      true,
      { mediaPrefix: prefix },
    );
    expect(ok.error).toBeUndefined();
    expect(ok.payload.cover_url).toBe(`${prefix}a.png`);
  });
  it("rejeita URL externa, javascript: e ausência de prefixo configurado", () => {
    for (const bad of ["https://evil.com/a.png", "javascript:alert(1)"]) {
      expect(
        buildPayload(projects, form({ title: "X", cover_url__current: bad }), true, {
          mediaPrefix: prefix,
        }).error,
      ).toBeTruthy();
    }
    expect(
      buildPayload(projects, form({ title: "X", cover_url__current: `${prefix}a.png` }), true, {})
        .error,
    ).toBeTruthy();
  });
  it("campo vazio vira null (remoção do arquivo)", () => {
    expect(
      buildPayload(projects, form({ title: "X", cover_url__current: "" }), true, {
        mediaPrefix: prefix,
      }).payload.cover_url,
    ).toBeNull();
  });
});

describe("configuração dos recursos", () => {
  it("relação de cliente usa a view que não expõe e-mail/telefone", () => {
    const rel = getResource("projetos")!.fields.find((f) => f.name === "client_id")!.relation!;
    expect(rel.table).toBe("client_options");
  });
  it("campos de imagem obrigatórios das mídias existem", () => {
    for (const k of ["midias-projeto", "midias-produto"]) {
      const f = getResource(k)!.fields.find((x) => x.name === "url")!;
      expect(f.type).toBe("image");
      expect(f.required).toBe(true);
    }
    expect(resources.length).toBeGreaterThan(8);
  });
});
