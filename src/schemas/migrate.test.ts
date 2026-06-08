import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { migrarPersonajeV1 } from "@/schemas/migrate";

describe("migrarPersonajeV1", () => {
  it("convierte conditions a conditionsCustom y migra a v3", () => {
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

    const v3 = migrarPersonajeV1(v1);
    expect(v3.schemaVersion).toBe(3);
    expect(v3.combat.conditionsCustom).toEqual(["Herido", "Maldito"]);
    expect(v3.identity.classes).toHaveLength(1);
    expect(v3.equipment.items.every((i) => i.weightLb === 0)).toBe(true);
  });
});
