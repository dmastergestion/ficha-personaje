import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { inferirAtributoConjuro, lanzarConjuro } from "@/rules/spell-cast";
import { clasesParaConjuros } from "@/rules/spells";

describe("lanzarConjuro", () => {
  it("infiere atributo de conjuro desde la clase", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    expect(inferirAtributoConjuro(character)).toBe("int");
  });

  it("gasta espacio al lanzar conjuro de nivel", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.identity.level = 1;

    const result = lanzarConjuro(character, 1, "normal");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.character.spells.spellSlotsUsed["1"]).toBe(1);
    expect(result.cd).toBe(10);
  });

  it("tira ataque solo en conjuros de ataque", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.identity.level = 1;

    const ataque = lanzarConjuro(character, 1, "normal", { spellId: "guiding-bolt" });
    expect(ataque.ok).toBe(true);
    if (!ataque.ok) return;
    expect(ataque.castType).toBe("attack");
    expect(ataque.roll).not.toBeNull();
  });

  it("conjuros de salvación gastan espacio sin tirada de ataque", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.identity.level = 5;

    const result = lanzarConjuro(character, 3, "normal", { spellId: "fireball" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.castType).toBe("save");
    expect(result.saveAbility).toBe("dex");
    expect(result.roll).toBeNull();
    expect(result.character.spells.spellSlotsUsed["3"]).toBe(1);
  });

  it("no gasta espacio con trucos", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";

    const result = lanzarConjuro(character, 0, "normal");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.character.spells.spellSlotsUsed["1"]).toBe(0);
  });

  it("lanza aunque spellSlotsUsed tenga claves faltantes", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.spells.spellSlotsUsed = { "1": 0 } as typeof character.spells.spellSlotsUsed;

    const result = lanzarConjuro(character, 1, "normal");
    expect(result.ok).toBe(true);
  });

  it("lanza con nivel desincronizado en personaje de una sola clase", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.identity.level = 3;
    character.identity.classes = [{ classId: "wizard", subclassId: null, level: 1 }];

    expect(clasesParaConjuros(character)[0]?.level).toBe(3);

    const result = lanzarConjuro(character, 1, "normal");
    expect(result.ok).toBe(true);
  });
});
