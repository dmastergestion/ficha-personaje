import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { pvMaximoPersonaje, recursosCompletos, sanitizarRecursos } from "@/rules/resources";

describe("pvMaximoPersonaje", () => {
  it("nivel 1 usa el máximo del dado + CON", () => {
    expect(pvMaximoPersonaje("d10", 14, 1)).toBe(12);
  });

  it("niveles superiores usan el promedio del dado + CON", () => {
    expect(pvMaximoPersonaje("d10", 14, 3)).toBe(28);
  });
});

describe("recursosCompletos", () => {
  it("deja vida y espacios al máximo", () => {
    const base = crearPersonajeVacio({ name: "Test", playerName: "Jugador", classId: "wizard", level: 3 });
    const damaged = {
      ...base,
      combat: {
        ...base.combat,
        hpMax: 30,
        hpCurrent: 5,
        hpTemp: 8,
        hitDiceUsed: 2,
      },
      spells: {
        ...base.spells,
        spellSlotsUsed: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        concentratingOn: "levitate",
      },
    };

    const full = recursosCompletos(damaged);
    expect(full.combat.hpCurrent).toBe(30);
    expect(full.combat.hpTemp).toBe(0);
    expect(full.combat.hitDiceUsed).toBe(0);
    expect(full.spells.spellSlotsUsed).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
    });
    expect(full.spells.concentratingOn).toBeNull();
  });
});

describe("sanitizarRecursos", () => {
  it("corrige espacios legacy invertidos sin tocar PV dañados", () => {
    const base = crearPersonajeVacio({ name: "Test", playerName: "Jugador", classId: "wizard", level: 3 });
    const legacy = {
      ...base,
      combat: {
        ...base.combat,
        hpMax: 30,
        hpCurrent: 30,
        hitDiceUsed: 0,
      },
      spells: {
        ...base.spells,
        spellSlotsUsed: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      },
    };

    const fixed = sanitizarRecursos(legacy);
    expect(fixed.spells.spellSlotsUsed[1]).toBe(0);
    expect(fixed.spells.spellSlotsUsed[2]).toBe(0);
    expect(fixed.combat.hpCurrent).toBe(30);
  });

  it("restaura dados de golpe en ficha intacta con todos gastados", () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "Jugador",
      classId: "fighter",
      level: 1,
    });
    const broken = {
      ...base,
      combat: { ...base.combat, hitDiceTotal: 1, hitDiceUsed: 1 },
    };

    const fixed = sanitizarRecursos(broken);
    expect(fixed.combat.hitDiceUsed).toBe(0);
    expect(fixed.combat.hitDiceTotal).toBe(1);
  });

  it("restaura recursos de clase agotados en ficha intacta", () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "Jugador",
      classId: "fighter",
      level: 1,
    });
    const broken = {
      ...base,
      resources: [
        {
          id: "fighter:second-wind",
          name: "Segundo aliento",
          max: 2,
          used: 2,
          recharge: "short" as const,
          source: "class" as const,
        },
      ],
    };

    const fixed = sanitizarRecursos(broken);
    expect(fixed.resources[0]?.used).toBe(0);
  });

  it("conserva espacios gastados cuando hay daño real", () => {
    const base = crearPersonajeVacio({ name: "Test", playerName: "Jugador", classId: "wizard", level: 3 });
    const inCombat = {
      ...base,
      combat: {
        ...base.combat,
        hpMax: 30,
        hpCurrent: 12,
        hitDiceUsed: 0,
      },
      spells: {
        ...base.spells,
        spellSlotsUsed: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
      },
    };

    const kept = sanitizarRecursos(inCombat);
    expect(kept.spells.spellSlotsUsed[1]).toBe(2);
    expect(kept.combat.hpCurrent).toBe(12);
  });
});
