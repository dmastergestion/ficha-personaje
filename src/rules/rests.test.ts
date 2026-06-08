import { describe, expect, it, vi, afterEach } from "vitest";
import { aplicarDescansoLargo, gastarDadoGolpe } from "@/rules/rests";
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
