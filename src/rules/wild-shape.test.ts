import { describe, expect, it } from "vitest";
import {
  bestiasElegibles,
  formasSalvajeCompletas,
  fusionarFormasSalvaje,
  limitesFormaSalvaje,
  parsearFormasSalvaje,
} from "@/rules/wild-shape";

describe("wild-shape", () => {
  it("aplica tabla SRD 2024 por nivel", () => {
    expect(limitesFormaSalvaje(1)).toBeNull();
    expect(limitesFormaSalvaje(2)).toEqual({ maxFormas: 4, maxCr: 0.25, permiteVuelo: false });
    expect(limitesFormaSalvaje(5)).toEqual({ maxFormas: 6, maxCr: 0.5, permiteVuelo: false });
    expect(limitesFormaSalvaje(8)).toEqual({ maxFormas: 8, maxCr: 1, permiteVuelo: true });
  });

  it("excluye vuelo antes de nivel 8", () => {
    const nivel4 = bestiasElegibles(4);
    expect(nivel4.some((b) => b.id === "wolf")).toBe(true);
    expect(nivel4.some((b) => b.id === "giant-eagle")).toBe(false);
    const nivel8 = bestiasElegibles(8);
    expect(nivel8.some((b) => b.id === "giant-eagle")).toBe(true);
  });

  it("asigna formas recomendadas si no hay elección", () => {
    const forms = parsearFormasSalvaje(fusionarFormasSalvaje(2, undefined));
    expect(forms).toEqual(["rat", "riding-horse", "spider", "wolf"]);
  });

  it("requiere el número exacto de formas conocidas", () => {
    expect(formasSalvajeCompletas(2, "rat,wolf,spider")).toBe(false);
    expect(formasSalvajeCompletas(2, "rat,wolf,spider,riding-horse")).toBe(true);
  });
});
