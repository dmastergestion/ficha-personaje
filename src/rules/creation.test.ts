import { describe, expect, it } from "vitest";
import {
  asignarArrayEstandar,
  asignarArrayEstandarManual,
  asignarTiradas4d6,
  crearPersonajeDesdeAsistente,
  indicesLibresAsignacion,
  pointBuyValido,
  puntosGastadosPointBuy,
  abilitiesPointBuyInicial,
  PRESUPUESTO_POINT_BUY,
  pvMaximoNivel1,
} from "@/rules/creation";
import type { Tirada4d6 } from "@/rules/dice";
import { conjurosOtorgadosLanzables } from "@/rules/spell-grants";
import { esProficientePericia } from "@/rules/character";
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

describe("point buy", () => {
  it("gasta 27 puntos en el array 15/14/13/12/10/8", () => {
    const abilities = {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    };
    expect(puntosGastadosPointBuy(abilities)).toBe(PRESUPUESTO_POINT_BUY);
    expect(pointBuyValido(abilities)).toBe(true);
    expect(pointBuyValido(abilitiesPointBuyInicial())).toBe(false);
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

  it("oculta índices ya asignados a otro atributo", () => {
    const asignacion = { str: 0, dex: 1 };
    expect(indicesLibresAsignacion(asignacion, "con", 6)).toEqual([2, 3, 4, 5]);
    expect(indicesLibresAsignacion(asignacion, "str", 6)).toEqual([0, 2, 3, 4, 5]);
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
    expect(character.proficiencies.skills).toEqual(["perception", "arcana", "history"]);
    expect(character.proficiencies.toolProficiencies).toContain("calligrapher's supplies");
    expect(character.feats.some((f) => f.id === "magic-initiate")).toBe(true);
    expect(character.feats.some((f) => f.id === "alert")).toBe(true);
    expect(character.abilities.int).toBeGreaterThan(15);
    expect(character.identity.classes).toEqual([
      { classId: "wizard", subclassId: null, level: 1 },
    ]);
    expect(character.combat.hpCurrent).toBe(character.combat.hpMax);
    expect(character.combat.hitDiceUsed).toBe(0);
    expect(character.resources.length).toBeGreaterThan(0);
    expect(character.resources.every((r) => r.used === 0)).toBe(true);
  });

  it("alto elfo brujo archifey recibe prestidigitación, paso brumoso y usos gratis", () => {
    const character = crearPersonajeDesdeAsistente({
      name: "Aelith",
      playerName: "",
      speciesId: "elf-high",
      backgroundId: null,
      classId: "warlock",
      subclassId: "archfey",
      level: 3,
      abilities: asignarArrayEstandar("warlock"),
      originChoices: {
        species: { "lineage-casting-ability": "cha", "keen-senses": "perception" },
        background: {},
        class: { equipment: "A", "eldritch-invocations": "pact-of-the-tome,armor-of-shadows,eldritch-mind" },
      },
    });
    const ids = conjurosOtorgadosLanzables(character).map((g) => g.spellId);
    expect(ids).toContain("prestidigitation");
    expect(ids).toContain("detect-magic");
    expect(ids).toContain("misty-step");
    expect(ids).toContain("faerie-fire");
    expect(character.resources.some((r) => r.id === "species:elf-high:l3-free")).toBe(true);
    expect(character.resources.some((r) => r.id === "subclass:archfey:misty-step-free")).toBe(true);
  });

  it("guerrero fusiona 2 pericias de clase con las de origen", () => {
    const character = crearPersonajeDesdeAsistente({
      name: "G",
      playerName: "J",
      speciesId: null,
      backgroundId: "soldier",
      classId: "fighter",
      subclassId: null,
      level: 1,
      abilities: asignarArrayEstandar("fighter"),
      originChoices: {
        species: {},
        background: {},
        class: { "skill-1": "athletics", "skill-2": "insight", equipment: "A" },
      },
    });
    expect(character.proficiencies.skills).toEqual(
      expect.arrayContaining(["athletics", "insight"]),
    );
  });

  it("aplica las pericias de Hábil elegidas en el asistente", () => {
    const character = crearPersonajeDesdeAsistente({
      name: "C",
      playerName: "J",
      speciesId: "human",
      backgroundId: "charlatan",
      classId: "rogue",
      subclassId: null,
      level: 1,
      abilities: asignarArrayEstandar("rogue"),
      originChoices: {
        species: { "versatile-feat": "lucky", skillful: "perception" },
        background: {},
        class: { "skill-1": "stealth", "skill-2": "acrobatics", "skill-3": "investigation", "skill-4": "insight" },
      },
      featChoices: {
        skilled: { "skill-1": "athletics", "skill-2": "survival", "skill-3": "medicine" },
      },
    });
    expect(character.feats.some((f) => f.id === "skilled")).toBe(true);
    expect(character.feats.find((f) => f.id === "skilled")?.choices).toEqual({
      "skill-1": "athletics",
      "skill-2": "survival",
      "skill-3": "medicine",
    });
    expect(esProficientePericia(character, "athletics")).toBe(true);
    expect(esProficientePericia(character, "survival")).toBe(true);
    expect(esProficientePericia(character, "medicine")).toBe(true);
  });
});