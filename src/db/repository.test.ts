import { describe, expect, it, beforeEach } from "vitest";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import { crearPersonajeVacio } from "@/schemas/character";

describe("guardarPersonaje", () => {
  beforeEach(async () => {
    const { db } = await import("@/db");
    await db.characters.clear();
  });

  it("sincroniza classId y level con classes[] al guardar", async () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "J",
      classId: "fighter",
    });
    const character = {
      ...base,
      identity: {
        ...base.identity,
        classId: "fighter",
        level: 1,
        classes: [
          { classId: "fighter", subclassId: null, level: 3 },
          { classId: "wizard", subclassId: null, level: 2 },
        ],
      },
    };

    await guardarPersonaje(character);
    const saved = await obtenerPersonaje(character.id);
    expect(saved?.identity.level).toBe(5);
    expect(saved?.identity.classId).toBe("fighter");
    expect(saved?.spells.abilityKey).toBeTruthy();
  });

  it("conserva datos tras guardar y recargar", async () => {
    const character = crearPersonajeVacio({
      name: "Roundtrip",
      playerName: "J",
      classId: "cleric",
    });
    character.notes = "Nota de prueba";
    character.feats.push({ id: "alert", name: "Alerta" });

    await guardarPersonaje(character);
    const saved = await obtenerPersonaje(character.id);

    expect(saved?.notes).toBe("Nota de prueba");
    expect(saved?.feats).toHaveLength(1);
    expect(saved?.identity.name).toBe("Roundtrip");
  });
});
