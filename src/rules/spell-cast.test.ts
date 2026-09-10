import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { inferirAtributoConjuro, lanzarConjuro, opcionesRanuraConjuro, textoDañoMostradoConjuro } from "@/rules/spell-cast";
import { metaTiradaConjuro, type SpellDamage } from "@/rules/spell-cast-meta";
import { srdSpells } from "@/rules/srd";
import { clasesParaConjuros } from "@/rules/spells";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { filasConjurosFicha, mejorRecursoLibreParaConjuro } from "@/rules/spell-grants";

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

  it("Detectar magia: el uso libre de Hechizos es el mismo recurso de Recursos", () => {
    const base = crearPersonajeVacio({
      name: "Alto",
      playerName: "",
      classId: "fighter",
      speciesId: "elf-high",
      level: 3,
    });
    const pj = poblarRecursosSugeridos({
      ...base,
      originChoices: {
        ...base.originChoices,
        species: { "lineage-casting-ability": "int" },
      },
    });
    const recId = mejorRecursoLibreParaConjuro(pj, "detect-magic");
    expect(recId).toBeTruthy();
    const antes = pj.resources.find((r) => r.id === recId);
    expect(antes?.used).toBe(0);
    expect(filasConjurosFicha(pj, [], "leveled").find((f) => f.spellId === "detect-magic")?.usosLibres).toEqual({
      restantes: 1,
      max: 1,
    });

    const result = lanzarConjuro(pj, 1, "normal", {
      spellId: "detect-magic",
      featResourceId: recId,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.resources.find((r) => r.id === recId)?.used).toBe(1);
    expect(
      filasConjurosFicha(result.character, [], "leveled").find((f) => f.spellId === "detect-magic")
        ?.usosLibres,
    ).toEqual({ restantes: 0, max: 1 });
  });

  it("añade Carisma al daño del truco de Descarga agonizante", () => {
    const character = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 2 });
    character.abilities.cha = 16;
    character.originChoices = {
      species: {},
      background: {},
      class: {
        "eldritch-invocations": "agonizing-blast",
        "agonizing-blast-cantrip": "eldritch-blast",
      },
    };

    const result = lanzarConjuro(character, 0, "normal", { spellId: "eldritch-blast" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damage).not.toBeNull();
    expect(result.damage?.formula).toMatch(/\+3$/);
    expect(result.damage?.total).toBe((result.damage?.rolls.reduce((a, b) => a + b, 0) ?? 0) + 3);
  });

  it("Descarga agonizante aplica Carisma aunque no esté persistido el truco", () => {
    const character = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 2 });
    character.abilities.cha = 16;
    character.originChoices = {
      species: {},
      background: {},
      class: { "eldritch-invocations": "agonizing-blast" },
    };
    const result = lanzarConjuro(character, 0, "normal", { spellId: "eldritch-blast" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.damage?.formula).toMatch(/\+3$/);
  });

  it("lista ranuras disponibles para upcast", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.identity.level = 5;
    const opciones = opcionesRanuraConjuro(character, 1);
    expect(opciones.map((o) => o.tipo === "slot" && o.level)).toEqual(["1", "2", "3"]);
  });

  it("gasta la ranura elegida al hacer upcast", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";
    character.identity.level = 5;

    const result = lanzarConjuro(character, 1, "normal", {
      spellId: "magic-missile",
      slotLevel: "3",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.spells.spellSlotsUsed["1"]).toBe(0);
    expect(result.character.spells.spellSlotsUsed["3"]).toBe(1);
    expect(result.slotGastado).toBe("Espacio niv. 3");
  });

  it("brujo siempre gasta pacto al nivel máximo, sin ranuras inferiores", () => {
    const character = crearPersonajeVacio({
      name: "B",
      playerName: "J",
      classId: "warlock",
      level: 5,
    });
    character.spells.abilityKey = "cha";
    const opciones = opcionesRanuraConjuro(character, 1);
    expect(opciones).toEqual([
      expect.objectContaining({ tipo: "pact", level: 3, restantes: 2, max: 2 }),
    ]);

    const result = lanzarConjuro(character, 1, "normal", { spellId: "burning-hands" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.spells.pactMagicUsed).toBe(1);
    expect(result.character.spells.spellSlotsUsed["1"]).toBe(0);
    expect(result.slotGastado).toBe("Pacto niv. 3");
    expect(result.damage?.formula).toBe("5d6");
    expect(textoDañoMostradoConjuro(character, "scorching-ray", { dice: "2d6", type: "fuego" }, 2)).toBe(
      "4×2d6",
    );
    expect(textoDañoMostradoConjuro(character, "eldritch-blast", { dice: "1d10", type: "fuerza" }, 0)).toBe(
      "2×1d10",
    );
    expect(
      textoDañoMostradoConjuro(character, "hex", { type: "necrótico" } as unknown as SpellDamage),
    ).toBe("");
    for (const spell of srdSpells) {
      const meta = metaTiradaConjuro(spell.id, spell);
      const daño = meta.damage;
      if (!daño) continue;
      expect(() => textoDañoMostradoConjuro(character, spell.id, daño, spell.level)).not.toThrow();
    }
  });
});
