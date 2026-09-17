import { describe, expect, it } from "vitest";
import {
  agregarClase,
  ajustarNivelTotal,
  cumpleRequisitoClase,
  descripcionClases,
  etiquetaListaPersonaje,
  errorRequisitoAtributos,
  faltaElegirSubclase,
  nivelTotalClases,
  puedeElegirSubclase,
  sincronizarIdentidadMulticlase,
  subclaseValidaParaClase,
  textoRequisitoMulticlase,
  validarClases,
  validarRequisitosMulticlase,
} from "@/rules/multiclass";

describe("multiclass", () => {
  it("calcula nivel total", () => {
    expect(
      nivelTotalClases([
        { classId: "fighter", subclassId: null, level: 5 },
        { classId: "wizard", subclassId: null, level: 3 },
      ]),
    ).toBe(8);
  });

  it("valida suma máxima 20", () => {
    expect(
      validarClases([
        { classId: "fighter", subclassId: null, level: 15 },
        { classId: "wizard", subclassId: null, level: 6 },
      ]),
    ).toMatch(/1 y 20/);
  });

  it("sincroniza clase principal", () => {
    const sync = sincronizarIdentidadMulticlase([
      { classId: "fighter", subclassId: null, level: 3 },
      { classId: "wizard", subclassId: null, level: 7 },
    ]);
    expect(sync.classId).toBe("wizard");
    expect(sync.level).toBe(10);
  });

  it("no permite clases duplicadas al agregar", () => {
    const base = [{ classId: "fighter", subclassId: null, level: 5 }];
    expect(agregarClase(base, "fighter")).toBeNull();
    expect(agregarClase(base, "wizard")).toHaveLength(2);
  });

  it("el guerrero pide FUE o DES; el monje las dos", () => {
    const scores = { str: 13, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    expect(cumpleRequisitoClase(scores, "fighter")).toBe(true);
    expect(cumpleRequisitoClase(scores, "monk")).toBe(false);
    expect(cumpleRequisitoClase({ ...scores, dex: 13, wis: 13 }, "monk")).toBe(true);
    expect(textoRequisitoMulticlase("fighter")).toMatch(/o/);
    expect(textoRequisitoMulticlase("monk")).toMatch(/y/);
  });

  it("bloquea un dip de mago si Inteligencia es baja", () => {
    const classes = [
      { classId: "fighter", subclassId: null, level: 5 },
      { classId: "wizard", subclassId: null, level: 1 },
    ];
    const sinInt = { str: 15, dex: 14, con: 14, int: 10, wis: 10, cha: 8 };
    expect(validarRequisitosMulticlase(classes, sinInt)).toMatch(/Inteligencia 13/);
    expect(
      validarRequisitosMulticlase(classes, { ...sinInt, int: 13 }),
    ).toBeNull();
  });

  it("una sola clase no exige prerrequisito de multiclase", () => {
    expect(
      validarRequisitosMulticlase(
        [{ classId: "wizard", subclassId: null, level: 3 }],
        { str: 8, dex: 8, con: 10, int: 8, wis: 8, cha: 8 },
      ),
    ).toBeNull();
  });

  it("la clase actual también debe cumplir 13 para poder añadir otra", () => {
    const magoBajo = [{ classId: "wizard", subclassId: null, level: 5 }];
    const scores = { str: 15, dex: 14, con: 14, int: 10, wis: 10, cha: 8 };
    expect(errorRequisitoAtributos(magoBajo, scores)).toMatch(/Inteligencia 13/);
    expect(
      validarRequisitosMulticlase(
        [...magoBajo, { classId: "fighter", subclassId: null, level: 1 }],
        scores,
      ),
    ).toMatch(/Inteligencia 13/);
  });

  it("describe clases para UI", () => {
    expect(
      descripcionClases([{ classId: "fighter", subclassId: null, level: 2 }]),
    ).toContain("2");
  });

  it("en la lista no repite Total si solo hay una clase", () => {
    const solo = etiquetaListaPersonaje(
      [{ classId: "barbarian", subclassId: null, level: 3 }],
      3,
    );
    expect(solo).not.toMatch(/Total/);
    expect(solo).toMatch(/3/);
    expect(
      etiquetaListaPersonaje(
        [
          { classId: "barbarian", subclassId: null, level: 3 },
          { classId: "fighter", subclassId: null, level: 2 },
        ],
        5,
      ),
    ).toMatch(/Total 5/);
  });

  it("ajusta nivel total de uno en uno", () => {
    const base = [{ classId: "wizard", subclassId: null, level: 3 }];
    expect(ajustarNivelTotal(base, 1)).toEqual([
      { classId: "wizard", subclassId: null, level: 4 },
    ]);
    expect(ajustarNivelTotal(base, -1)).toEqual([
      { classId: "wizard", subclassId: null, level: 2 },
    ]);
    expect(ajustarNivelTotal([{ classId: "wizard", subclassId: null, level: 1 }], -1)).toBeNull();
  });

  it("exige subclase al alcanzar el nivel de rama", () => {
    const bajo = { classId: "fighter", subclassId: null, level: 2 };
    const alto = { classId: "fighter", subclassId: null, level: 3 };
    expect(puedeElegirSubclase(bajo)).toBe(false);
    expect(puedeElegirSubclase(alto)).toBe(true);
    expect(faltaElegirSubclase(alto)).toBe(true);
    expect(faltaElegirSubclase({ classId: "warlock", subclassId: null, level: 1 })).toBe(false);
    expect(faltaElegirSubclase({ classId: "warlock", subclassId: null, level: 3 })).toBe(true);
    expect(subclaseValidaParaClase("fighter", "champion")).toBe(true);
    expect(subclaseValidaParaClase("wizard", "champion")).toBe(false);
  });
});
