import { describe, expect, it } from "vitest";
import {
  clampIndicePaso,
  textoMejoraCreacion,
  validarAsignacionAtributos,
  validarEstiloCombateCreacion,
  validarMejorasCreacion,
  validarPasoAsistente,
} from "@/rules/creation-wizard";
import { ORIGIN_CHOICES_EMPTY } from "@/rules/origin-choices";
import type { DatosAsistente } from "@/rules/creation";

describe("clampIndicePaso", () => {
  it("acota el índice si se acorta la lista de pasos", () => {
    expect(clampIndicePaso(5, 4)).toBe(3);
    expect(clampIndicePaso(-1, 3)).toBe(0);
  });
});

describe("validarAsignacionAtributos", () => {
  it("exige un método del PHB", () => {
    expect(
      validarAsignacionAtributos({
        modo: "sinElegir",
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        tiradas4d6: null,
        asignacion4d6: {},
        asignacionArray: {},
      }),
    ).toMatch(/4d6|array|compra/i);
  });

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

describe("textoMejoraCreacion", () => {
  it("resume ASI y dote", () => {
    expect(
      textoMejoraCreacion({ modo: "asi", asiDos: false, asiA: "str", asiB: "dex" }),
    ).toMatch(/Fuerza/i);
    expect(
      textoMejoraCreacion({ modo: "feat", asiDos: false, asiA: "str", asiB: "dex", featId: "alert" }),
    ).toMatch(/Alerta|Alert|dote/i);
  });
});

describe("validarPasoAsistente origen", () => {
  const extras = {
    originChoices: ORIGIN_CHOICES_EMPTY,
    modoAtributos: "sinElegir" as const,
    tiradas4d6: null,
    asignacion4d6: {},
    asignacionArray: {},
    periciasClaseOk: true,
    faltaClase: null,
    maestriasOk: true,
    conjurosMsg: null,
    conjurosClaseMsg: null,
  };

  const base: DatosAsistente = {
    name: "A",
    playerName: "",
    speciesId: "human",
    backgroundId: null,
    classId: "fighter",
    subclassId: null,
    level: 1,
    abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  };

  it("exige trasfondo", () => {
    expect(validarPasoAsistente("origen", base, extras)).toBe("Elige un trasfondo.");
    expect(
      validarPasoAsistente("origen", { ...base, backgroundId: "soldier" }, extras),
    ).not.toBe("Elige un trasfondo.");
  });
});

describe("validarPasoAsistente clase", () => {
  it("exige elegir clase", () => {
    const extras = {
      originChoices: ORIGIN_CHOICES_EMPTY,
      modoAtributos: "sinElegir" as const,
      tiradas4d6: null,
      asignacion4d6: {},
      asignacionArray: {},
      periciasClaseOk: true,
      faltaClase: null,
      maestriasOk: true,
      conjurosMsg: null,
      conjurosClaseMsg: null,
    };
    expect(
      validarPasoAsistente(
        "clase",
        {
          name: "A",
          playerName: "",
          speciesId: null,
          backgroundId: null,
          classId: null,
          subclassId: null,
          level: 1,
          abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        },
        extras,
      ),
    ).toBe("Elige una clase.");
  });
});
