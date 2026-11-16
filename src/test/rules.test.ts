import { describe, expect, it } from "vitest";
import {
  REWARDS,
  canRedeem,
  pointsForReport,
  validateImageFile,
} from "@/lib/mobility/rules";

describe("pontuação de reportes", () => {
  it("dá +50 pontos por buraco na via", () => {
    expect(pointsForReport("pothole")).toBe(50);
  });
  it("dá +50 pontos por alagamento", () => {
    expect(pointsForReport("flood")).toBe(50);
  });
  it("dá +30 pontos por iluminação", () => {
    expect(pointsForReport("lighting")).toBe(30);
  });
});

describe("resgate de gift cards", () => {
  const uber = REWARDS.find((r) => r.brand === "uber")!;
  it("bloqueia resgate sem saldo suficiente", () => {
    expect(canRedeem(uber.cost - 1, uber)).toBe(false);
  });
  it("permite resgate com saldo exato", () => {
    expect(canRedeem(uber.cost, uber)).toBe(true);
  });
});

describe("upload de imagens", () => {
  it("aceita PNG, JPEG e WebP", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateImageFile({ type, size: 1000 }).ok).toBe(true);
    }
  });
  it("recusa GIF", () => {
    expect(validateImageFile({ type: "image/gif", size: 1000 }).ok).toBe(false);
  });
  it("recusa arquivos acima de 5MB", () => {
    expect(validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 }).ok).toBe(false);
    expect(validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 }).ok).toBe(true);
  });
});
