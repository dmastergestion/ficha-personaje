import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  atributoConjuroPredeterminado,
  conjuroDisponibleParaPersonaje,
  nivelMaximoConjuroClase,
} from "@/rules/spell-lists";

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

  it("paladín niv 5 puede hasta niv 2", () => {
    expect(nivelMaximoConjuroClase("paladin", 5)).toBe(2);
  });
});
