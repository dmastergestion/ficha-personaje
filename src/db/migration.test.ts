import Dexie, { type EntityTable } from "dexie";
import { describe, expect, it } from "vitest";
import { FichaDatabase } from "@/db";
import { CharacterSchema, crearPersonajeVacio } from "@/schemas/character";

class LegacyDatabase extends Dexie {
  characters!: EntityTable<Record<string, unknown>, "id">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ characters: "id" });
  }
}

describe("Dexie v2", () => {
  it("persiste personaje schema v2", async () => {
    const db = new FichaDatabase(`test-v2-${crypto.randomUUID()}`);
    const character = crearPersonajeVacio({
      name: "Test",
      playerName: "Jugador",
      classId: "fighter",
    });

    await db.characters.put(CharacterSchema.parse(character));
    const loaded = await db.characters.get(character.id);

    expect(loaded?.schemaVersion).toBe(3);
    expect(loaded?.combat.conditionIds).toEqual([]);
    await db.delete();
  });

  it("migra registros v1 en upgrade", async () => {
    const dbName = `test-mig-${crypto.randomUUID()}`;
    const base = crearPersonajeVacio({ name: "Legacy", playerName: "P", classId: "rogue" });

    const legacyChar = {
      ...base,
      schemaVersion: 1,
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
        conditions: ["Cansado"],
      },
    };

    const legacy = new LegacyDatabase(dbName);
    await legacy.characters.put(legacyChar);
    await legacy.close();

    const upgraded = new FichaDatabase(dbName);
    const loaded = await upgraded.characters.get(base.id);

    expect(loaded?.schemaVersion).toBe(3);
    expect(loaded?.combat.conditionsCustom).toEqual(["Cansado"]);
    await upgraded.delete();
  });
});
