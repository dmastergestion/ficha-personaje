import { describe, expect, it, vi, afterEach } from "vitest";
import { aplicarDescansoLargo, aplicarDescansoCorto, gastarDadoGolpe } from "@/rules/rests";
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
