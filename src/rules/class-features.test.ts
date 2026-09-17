import { describe, expect, it } from "vitest";
import { nivelSubclase, rasgosDeSubclase } from "@/rules/class-features";

describe("rasgosDeSubclase", () => {
  it("resuelve el alias hand ↔ open-hand", () => {
    expect(rasgosDeSubclase("hand").length).toBeGreaterThan(0);
    expect(rasgosDeSubclase("open-hand").length).toBeGreaterThan(0);
  });
});

describe("nivelSubclase", () => {
  it("brujo elige subclase a nivel 3", () => {
    expect(nivelSubclase("warlock")).toBe(3);
  });
});
