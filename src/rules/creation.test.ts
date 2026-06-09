import { describe, expect, it } from "vitest";
import {
  asignarArrayEstandar,
  asignarArrayEstandarManual,
  asignarTiradas4d6,
  crearPersonajeDesdeAsistente,
  pvMaximoNivel1,
} from "@/rules/creation";
import type { Tirada4d6 } from "@/rules/dice";
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

describe("asignarArrayEstandarManual", () => {
  it("asigna valores del array a elección del jugador", () => {
    const result = asignarArrayEstandarManual({
      str: 0,
      dex: 1,
      con: 2,
      int: 3,
      wis: 4,
      cha: 5,
    });
    expect(result).toEqual({
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    });
  });
});

describe("asignarTiradas4d6", () => {
  it("asigna seis tiradas distintas a atributos", () => {
    const tiradas: Tirada4d6[] = [
      { dice: [6, 5, 4, 1], dropped: 1, total: 15 },
      { dice: [6, 4, 3, 2], dropped: 2, total: 13 },
      { dice: [5, 4, 3, 2], dropped: 2, total: 12 },
      { dice: [4, 3, 3, 2], dropped: 2, total: 10 },
      { dice: [3, 3, 2, 2], dropped: 2, total: 8 },
      { dice: [6, 6, 5, 1], dropped: 1, total: 17 },
    ];
    const result = asignarTiradas4d6(tiradas, {
      str: 0,
      dex: 1,
      con: 2,
      int: 3,
      wis: 4,
      cha: 5,
    });
    expect(result).toEqual({
      str: 15,
      dex: 13,
      con: 12,
      int: 10,
      wis: 8,
      cha: 17,
    });
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
    expect(character.identity.classes).toEqual([
      { classId: "wizard", subclassId: null, level: 1 },
    ]);
    expect(character.combat.hpCurrent).toBe(character.combat.hpMax);
    expect(character.combat.hitDiceUsed).toBe(0);
    expect(character.resources.length).toBeGreaterThan(0);
    expect(character.resources.every((r) => r.used === 0)).toBe(true);
  });
});