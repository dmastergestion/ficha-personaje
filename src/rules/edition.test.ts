import { describe, expect, it } from "vitest";
import {
  AGOTAMIENTO_MAX,
  EDICION_REGLAS,
  dadosGolpeRecuperadosDescansoLargo,
  penalizacionAgotamiento,
  reduccionVelocidadAgotamiento,
} from "@/rules/edition";

describe("edition (PHB 2024)", () => {
  it("fija edición 2024", () => {
    expect(EDICION_REGLAS).toBe("2024");
  });

  it("agotamiento: −2×nivel a d20, −5×nivel pies", () => {
    expect(penalizacionAgotamiento(3)).toBe(-6);
    expect(reduccionVelocidadAgotamiento(3)).toBe(15);
    expect(AGOTAMIENTO_MAX).toBe(6);
  });

  it("descanso largo recupera todos los dados gastados", () => {
    expect(dadosGolpeRecuperadosDescansoLargo(4)).toBe(4);
    expect(dadosGolpeRecuperadosDescansoLargo(0)).toBe(0);
  });
});
