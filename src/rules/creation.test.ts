import { describe, expect, it } from "vitest";
import { asignarArrayEstandar, crearPersonajeDesdeAsistente, pvMaximoNivel1 } from "@/rules/creation";
describe("asignarArrayEstandar", () => {
  it("prioriza atributos principales de la clase", () => {
    const attrs = asignarArrayEstandar("wizard");
    expect(attrs.int).toBe(15);
    expect(attrs.con).toBe(14);
  });
});

describe("pvMaximoNivel1", () => {
  it("suma el máximo del dado de golpe y mod CON", () => {
    expect(pvMaximoNivel1("d10", 14)).toBe(12);
  });
});

describe("crearPersonajeDesdeAsistente", () => {
  it("asigna proficiencias de clase y trasfondo", () => {
    const character = crearPersonajeDesdeAsistente({
      name: "Gandalf",
      playerName: "DM",
      speciesId: "human",
      backgroundId: "sage",
      classId: "wizard",
      subclassId: null,
      level: 1,
      abilities: asignarArrayEstandar("wizard"),
    });
    expect(character.proficiencies.savingThrows).toEqual(["int", "wis"]);
    expect(character.proficiencies.skills).toEqual(["arcana", "history"]);
  });
});