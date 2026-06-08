import { describe, expect, it } from "vitest";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";

describe("modificadorAtributo", () => {
  it("calcula modificadores estándar", () => {
    expect(modificadorAtributo(10)).toBe(0);
    expect(modificadorAtributo(16)).toBe(3);
    expect(modificadorAtributo(8)).toBe(-1);
  });
});

describe("bonificadorCompetencia", () => {
  it("sigue la progresión 2024", () => {
    expect(bonificadorCompetencia(1)).toBe(2);
    expect(bonificadorCompetencia(5)).toBe(3);
    expect(bonificadorCompetencia(20)).toBe(6);
  });
});
