import { describe, expect, it } from "vitest";
import { obtenerArma } from "@/rules/srd";
import { infoArmaPorId, resumenArmaTooltip } from "@/rules/weapon-text";

describe("weapon-text", () => {
  it("resume una daga en español", () => {
    const weapon = obtenerArma("dagger")!;
    const tip = resumenArmaTooltip(weapon);
    expect(tip).toMatch(/perforante/i);
    expect(tip).toMatch(/Destreza/i);
  });

  it("infoArmaPorId devuelve filas", () => {
    const info = infoArmaPorId("longsword");
    expect(info).not.toBeNull();
    expect(info!.rows.some((r) => r.label === "Versátil")).toBe(true);
  });
});
