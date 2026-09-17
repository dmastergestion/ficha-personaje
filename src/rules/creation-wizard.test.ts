import { describe, expect, it } from "vitest";
import {
  clampIndicePaso,
  validarAsignacionAtributos,
  validarEstiloCombateCreacion,
  validarMejorasCreacion,
} from "@/rules/creation-wizard";

describe("clampIndicePaso", () => {
  it("acota el índice si se acorta la lista de pasos", () => {
    expect(clampIndicePaso(5, 4)).toBe(3);
    expect(clampIndicePaso(-1, 3)).toBe(0);
  });
});

describe("validarAsignacionAtributos", () => {
  it("falla array o 4d6 incompletos", () => {
    expect(
      validarAsignacionAtributos({
        modo: "array",
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        tiradas4d6: null,
        asignacion4d6: {},
        asignacionArray: { str: 0 },
      }),
    ).toMatch(/array/i);
    expect(
      validarAsignacionAtributos({
        modo: "4d6",
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        tiradas4d6: null,
        asignacion4d6: {},
        asignacionArray: {},
      }),
    ).toMatch(/4d6/i);
  });
});

describe("validarEstiloCombateCreacion", () => {
  it("exige estilo de combate al crear guerrero", () => {
    expect(validarEstiloCombateCreacion("fighter", 1, null)).toMatch(/estilo/i);
    expect(validarEstiloCombateCreacion("fighter", 1, "archery")).toBeNull();
    expect(validarMejorasCreacion([], 1)).toMatch(/ASI|dote/i);
  });
});
