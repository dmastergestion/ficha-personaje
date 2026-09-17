import { describe, expect, it, vi, afterEach } from "vitest";
import {
  aplicarDescansoLargo,
  aplicarDescansoCorto,
  espaciosRestantesPersonaje,
  gastarDadoGolpe,
} from "@/rules/rests";
import { crearPersonajeVacio } from "@/schemas/character";

describe("aplicarDescansoLargo", () => {
  it("restaura PV al máximo y espacios de conjuro", () => {
    const pj = crearPersonajeVacio({ name: "Mago", playerName: "J", classId: "wizard" });
    pj.combat.hpCurrent = 3;
    pj.combat.hpMax = 20;
    pj.spells.spellSlotsUsed["1"] = 2;

    const next = aplicarDescansoLargo(pj);
    expect(next.combat.hpCurrent).toBe(20);
    expect(next.spells.spellSlotsUsed["1"]).toBe(0);
  });

  it("recupera todos los dados de golpe gastados", () => {
    const pj = crearPersonajeVacio({ name: "Mago", playerName: "J", classId: "wizard" });
    pj.combat.hitDiceTotal = 4;
    pj.combat.hitDiceUsed = 4;
    pj.combat.hitDiceSpentByDie = { d6: 4 };

    const next = aplicarDescansoLargo(pj);
    expect(next.combat.hitDiceUsed).toBe(0);
    expect(next.combat.hitDiceSpentByDie).toEqual({});
  });

  it("otorga inspiración heroica al humano", () => {
    const pj = crearPersonajeVacio({ name: "Humano", playerName: "J", classId: "fighter" });
    pj.identity.speciesId = "human";
    pj.combat.inspiration = false;

    const next = aplicarDescansoLargo(pj);
    expect(next.combat.inspiration).toBe(true);
  });
});

describe("aplicarDescansoCorto", () => {
  it("otorga inspiración al músico", () => {
    const pj = crearPersonajeVacio({ name: "Músico", playerName: "J", classId: "bard" });
    pj.feats = [{ id: "musician", name: "Músico" }];
    pj.combat.inspiration = false;

    const next = aplicarDescansoCorto(pj);
    expect(next.combat.inspiration).toBe(true);
  });

  it("Restauración hechicera recupera puntos ≤ mitad de nivel", () => {
    const base = crearPersonajeVacio({ name: "H", playerName: "J", classId: "sorcerer", level: 6 });
    base.identity.classes = [{ classId: "sorcerer", subclassId: null, level: 6 }];
    base.resources = [
      {
        id: "sorcerer:sorcery-points",
        name: "Puntos de hechicería",
        max: 6,
        used: 5,
        recharge: "long",
        source: "class",
      },
      {
        id: "sorcerer:sorcerous-restoration",
        name: "Restauración hechicera",
        max: 1,
        used: 0,
        recharge: "long",
        source: "class",
      },
    ];
    const next = aplicarDescansoCorto(base);
    expect(next.resources.find((r) => r.id === "sorcerer:sorcery-points")?.used).toBe(2);
    expect(next.resources.find((r) => r.id === "sorcerer:sorcerous-restoration")?.used).toBe(1);
  });

  it("Incansable reduce 1 agotamiento en descanso corto", () => {
    const pj = crearPersonajeVacio({ name: "R", playerName: "J", classId: "ranger", level: 10 });
    pj.identity.classes = [{ classId: "ranger", subclassId: null, level: 10 }];
    pj.combat.exhaustionLevel = 2;
    expect(aplicarDescansoCorto(pj).combat.exhaustionLevel).toBe(1);
  });
});

describe("espaciosRestantesPersonaje", () => {
  it("muestra espacios disponibles, no gastados", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.spellSlotsUsed["1"] = 1;
    expect(espaciosRestantesPersonaje(character)["1"]).toBe(1);
  });
});

describe("gastarDadoGolpe", () => {
  afterEach(() => vi.restoreAllMocks());

  it("cura y gasta un dado de golpe", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const pj = crearPersonajeVacio({ name: "Guerrero", playerName: "J", classId: "fighter" });
    pj.combat.hitDie = "d10";
    pj.combat.hitDiceTotal = 3;
    pj.combat.hpCurrent = 5;
    pj.combat.hpMax = 30;
    pj.abilities.con = 14;

    const result = gastarDadoGolpe(pj);
    expect(result).not.toBeNull();
    expect(result!.character.combat.hitDiceUsed).toBe(1);
    expect(result!.character.combat.hpCurrent).toBeGreaterThan(5);
  });
});
