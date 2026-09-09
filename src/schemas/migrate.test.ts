import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { migrarPersonajeV1, migrarPersonajeV8 } from "@/schemas/migrate";

describe("migrarPersonajeV1", () => {
  it("convierte conditions a conditionsCustom y migra a v9", () => {
    const base = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    const v1 = {
      ...base,
      schemaVersion: 1 as const,
      combat: {
        hpMax: base.combat.hpMax,
        hpCurrent: base.combat.hpCurrent,
        hpTemp: base.combat.hpTemp,
        hitDiceTotal: base.combat.hitDiceTotal,
        hitDiceUsed: base.combat.hitDiceUsed,
        hitDie: base.combat.hitDie,
        armorClassOverride: base.combat.armorClassOverride,
        initiativeOverride: base.combat.initiativeOverride,
        speedOverride: base.combat.speedOverride,
        inspiration: base.combat.inspiration,
        conditions: ["Herido", "Maldito"],
      },
    };

    const v6 = migrarPersonajeV1(v1);
    expect(v6.schemaVersion).toBe(9);
    expect(v6.proficiencies.expertise).toEqual([]);
    expect(v6.combat.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(v6.combat.conditionsCustom).toEqual(["Herido", "Maldito"]);
    expect(v6.identity.classes).toHaveLength(1);
    expect(v6.equipment.items.every((i) => i.weightLb === 0)).toBe(true);
  });
});

describe("migrarPersonajeV8", () => {
  it("añade expertise vacío y sube a schema v9", () => {
    const base = crearPersonajeVacio({ name: "A", playerName: "B", classId: "rogue" });
    const { expertise: _omit, ...profs } = base.proficiencies;
    const v8 = {
      ...base,
      schemaVersion: 8 as const,
      proficiencies: profs,
    };
    const next = migrarPersonajeV8(v8);
    expect(next.schemaVersion).toBe(9);
    expect(next.proficiencies.expertise).toEqual([]);
  });
});
