import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  espaciosMaximos,
  esLanzador,
  maxConjurosPreparados,
  maxTrucosConocidos,
  nivelEfectivoConjuro,
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

  it("paladín nivel 2 tiene espacios de medio lanzador", () => {
    expect(tipoLanzador("paladin")).toBe("half");
    expect(espaciosMaximos("paladin", 2)["1"]).toBe(2);
  });

  it("brujo usa espacios de pacto", () => {
    expect(tipoLanzador("warlock")).toBe("pact");
    expect(espaciosMaximos("warlock", 1)["1"]).toBe(1);
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
});

describe("límites de conjuros", () => {
  it("calcula trucos máximos del mago", () => {
    expect(maxTrucosConocidos([{ classId: "wizard", subclassId: null, level: 1 }])).toBe(3);
    expect(maxTrucosConocidos([{ classId: "wizard", subclassId: null, level: 10 }])).toBe(5);
  });

  it("calcula preparados del clérigo", () => {
    const character = crearPersonajeVacio({ name: "T", playerName: "J", classId: "cleric" });
    character.abilities.wis = 16;
    character.spells.abilityKey = "wis";
    expect(maxConjurosPreparados(character)).toBe(4);
  });
});
