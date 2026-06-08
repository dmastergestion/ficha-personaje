import { describe, expect, it } from "vitest";
import { FichaDatabase } from "@/db";
import { CharacterSchema, crearPersonajeVacio } from "@/schemas/character";

describe("Dexie v1", () => {
  it("persiste y recupera un personaje válido", async () => {
    const db = new FichaDatabase(`test-${crypto.randomUUID()}`);
    const character = crearPersonajeVacio({
      name: "Test",
      playerName: "Jugador",
      classId: "fighter",
    });

    await db.characters.put(CharacterSchema.parse(character));
    const loaded = await db.characters.get(character.id);

    expect(loaded?.identity.name).toBe("Test");
    expect(loaded?.schemaVersion).toBe(1);
    await db.delete();
  });
});
