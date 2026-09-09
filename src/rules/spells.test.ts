import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  agruparIdsConjuroPorNivel,
  compararConjurosPorNivel,
  espaciosMaximos,
  espaciosMaximosPersonaje,
  esLanzador,
  esLanzadorPersonaje,
  esSoloMagiaPacto,
  maxConjurosPreparados,
  maxTrucosConocidos,
  nivelEfectivoConjuro,
  ordenarIdsConjuro,
  tipoLanzador,
} from "@/rules/spells";

describe("espaciosMaximos", () => {
  it("mago nivel 1 tiene 2 espacios de nivel 1", () => {
    expect(espaciosMaximos("wizard", 1)["1"]).toBe(2);
  });

  it("guerrero no lanza conjuros", () => {
    expect(esLanzador("fighter")).toBe(false);
    expect(espaciosMaximos("fighter", 5)["1"]).toBe(0);
  });

  it("paladín nivel 1 tiene 2 espacios de nivel 1 (2024)", () => {
    expect(tipoLanzador("paladin")).toBe("half");
    expect(espaciosMaximos("paladin", 1)["1"]).toBe(2);
  });

  it("paladín nivel 2 tiene 3 espacios de nivel 1", () => {
    expect(espaciosMaximos("paladin", 2)["1"]).toBe(3);
  });

  it("paladín nivel 5 tiene 4/2 según tabla 2024", () => {
    const slots = espaciosMaximos("paladin", 5);
    expect(slots["1"]).toBe(4);
    expect(slots["2"]).toBe(2);
  });

  it("caballero élfico nivel 3 tiene 2 espacios de nivel 1", () => {
    expect(espaciosMaximos("fighter", 3, "eldritch-knight")["1"]).toBe(2);
  });

  it("brujo usa espacios de pacto", () => {
    expect(tipoLanzador("warlock")).toBe("pact");
    expect(espaciosMaximos("warlock", 1)["1"]).toBe(1);
  });
});

describe("espaciosMaximosPersonaje", () => {
  it("paladín de una sola clase usa su tabla, no la de mago", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "paladin" });
    expect(espaciosMaximosPersonaje(pj)["1"]).toBe(2);
    pj.identity.level = 5;
    pj.identity.classes = [{ classId: "paladin", subclassId: null, level: 5 }];
    const slots = espaciosMaximosPersonaje(pj);
    expect(slots["1"]).toBe(4);
    expect(slots["2"]).toBe(2);
  });

  it("explorador nivel 1 tiene espacios", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "ranger" });
    expect(espaciosMaximosPersonaje(pj)["1"]).toBe(2);
  });

  it("caballero élfico usa tabla de tercera parte", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.identity.level = 3;
    pj.identity.classes = [{ classId: "fighter", subclassId: "eldritch-knight", level: 3 }];
    expect(espaciosMaximosPersonaje(pj)["1"]).toBe(2);
  });

  it("mago 5 / paladín 2 usa tabla de mago a nivel efectivo 6", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.identity.level = 7;
    pj.identity.classes = [
      { classId: "wizard", subclassId: null, level: 5 },
      { classId: "paladin", subclassId: null, level: 2 },
    ];
    const slots = espaciosMaximosPersonaje(pj);
    expect(slots["1"]).toBe(4);
    expect(slots["2"]).toBe(3);
    expect(slots["3"]).toBe(3);
  });

  it("brujo de una sola clase no tiene espacios de tabla 1–9", () => {
    const pj = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 5 });
    expect(esSoloMagiaPacto(pj)).toBe(true);
    expect(esLanzadorPersonaje(pj)).toBe(true);
    expect(espaciosMaximosPersonaje(pj)["1"]).toBe(0);
    expect(espaciosMaximosPersonaje(pj)["3"]).toBe(0);
  });

  it("brujo no añade espacios normales; mago 5 / brujo 2 usa tabla de mago 5", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.identity.level = 7;
    pj.identity.classes = [
      { classId: "wizard", subclassId: null, level: 5 },
      { classId: "warlock", subclassId: null, level: 2 },
    ];
    const slots = espaciosMaximosPersonaje(pj);
    expect(slots["1"]).toBe(4);
    expect(slots["2"]).toBe(3);
    expect(slots["3"]).toBe(2);
    expect(esSoloMagiaPacto(pj)).toBe(false);
  });
});

describe("nivelEfectivoConjuro", () => {
  it("combina clases completas y medias", () => {
    expect(
      nivelEfectivoConjuro([
        { classId: "fighter", subclassId: null, level: 5 },
        { classId: "wizard", subclassId: null, level: 3 },
      ]),
    ).toBe(3);
  });

  it("suma terceras partes", () => {
    expect(
      nivelEfectivoConjuro([
        { classId: "fighter", subclassId: "eldritch-knight", level: 7 },
        { classId: "wizard", subclassId: null, level: 1 },
      ]),
    ).toBe(3);
  });
});

describe("límites de conjuros", () => {
  it("calcula trucos máximos del mago", () => {
    expect(maxTrucosConocidos([{ classId: "wizard", subclassId: null, level: 1 }])).toBe(3);
    expect(maxTrucosConocidos([{ classId: "wizard", subclassId: null, level: 10 }])).toBe(5);
  });

  it("calcula preparados del clérigo (tabla 2024)", () => {
    const character = crearPersonajeVacio({ name: "T", playerName: "J", classId: "cleric" });
    character.abilities.wis = 16;
    character.spells.abilityKey = "wis";
    expect(maxConjurosPreparados(character)).toBe(4);
  });

  it("bardo usa lista preparada", () => {
    const character = crearPersonajeVacio({ name: "T", playerName: "J", classId: "bard" });
    expect(maxConjurosPreparados(character)).toBe(4);
  });
});

describe("ordenarIdsConjuro", () => {
  it("ordena por nivel y luego por nombre", () => {
    const meta: Record<string, { level: number; name: string }> = {
      "fire-bolt": { level: 0, name: "Rayo de fuego" },
      fireball: { level: 3, name: "Bola de fuego" },
      shield: { level: 1, name: "Escudo" },
      "mage-armor": { level: 1, name: "Armadura de mago" },
    };
    expect(ordenarIdsConjuro(["fireball", "fire-bolt", "shield", "mage-armor"], (id) => meta[id]!)).toEqual([
      "fire-bolt",
      "mage-armor",
      "shield",
      "fireball",
    ]);
    expect(compararConjurosPorNivel(1, "Escudo", 0, "Rayo")).toBeGreaterThan(0);
  });

  it("agrupa por nivel de conjuro", () => {
    const meta: Record<string, { level: number; name: string }> = {
      shield: { level: 1, name: "Escudo" },
      "mage-armor": { level: 1, name: "Armadura de mago" },
      fireball: { level: 3, name: "Bola de fuego" },
    };
    expect(agruparIdsConjuroPorNivel(["fireball", "shield", "mage-armor"], (id) => meta[id]!)).toEqual([
      { level: 1, ids: ["mage-armor", "shield"] },
      { level: 3, ids: ["fireball"] },
    ]);
  });
});
