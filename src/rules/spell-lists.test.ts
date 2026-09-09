import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  atributoConjuroPredeterminado,
  conjuroDisponibleParaPersonaje,
  listaConjuro,
  nivelMaximoConjuroClase,
} from "@/rules/spell-lists";
import { srdSpells } from "@/rules/srd";

describe("atributoConjuroPredeterminado", () => {
  it("asigna INT al mago", () => {
    const c = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    expect(atributoConjuroPredeterminado(c)).toBe("int");
  });

  it("asigna CHA al paladín, no FUE", () => {
    const c = crearPersonajeVacio({ name: "T", playerName: "J", classId: "paladin" });
    expect(atributoConjuroPredeterminado(c)).toBe("cha");
  });
});

describe("filtro de listas", () => {
  it("fireball está en lista de mago niv 5", () => {
    expect(
      conjuroDisponibleParaPersonaje("fireball", 3, {
        classId: "wizard",
        subclassId: null,
        level: 5,
      }),
    ).toBe(true);
  });

  it("fireball no está para explorador niv 3", () => {
    expect(
      conjuroDisponibleParaPersonaje("fireball", 3, {
        classId: "ranger",
        subclassId: null,
        level: 3,
      }),
    ).toBe(false);
  });

  it("paladín niv 1 puede preparar conjuros de nivel 1 sin espacios", () => {
    expect(nivelMaximoConjuroClase("paladin", 1)).toBe(1);
  });

  it("paladín niv 5 puede hasta niv 2", () => {
    expect(nivelMaximoConjuroClase("paladin", 5)).toBe(2);
  });

  it("sin entrada en listas no está disponible para nadie", () => {
    expect(
      conjuroDisponibleParaPersonaje("conjuro-inventado-xyz", 1, {
        classId: "wizard",
        subclassId: null,
        level: 5,
      }),
    ).toBe(false);
  });

  it("risa horrible está en lista de bardo y mago, no de explorador", () => {
    const bard = { classId: "bard", subclassId: null, level: 1 };
    const wizard = { classId: "wizard", subclassId: null, level: 1 };
    const ranger = { classId: "ranger", subclassId: null, level: 3 };
    expect(conjuroDisponibleParaPersonaje("hideous-laughter", 1, bard)).toBe(true);
    expect(conjuroDisponibleParaPersonaje("tashas-hideous-laughter", 1, wizard)).toBe(true);
    expect(conjuroDisponibleParaPersonaje("hideous-laughter", 1, ranger)).toBe(false);
  });

  it("todo conjuro SRD tiene lista de clase o subclase", () => {
    const sinLista = srdSpells.filter((s) => !listaConjuro(s.id));
    expect(sinLista.map((s) => s.id)).toEqual([]);
  });
});
