import { describe, expect, it } from "vitest";
import { descripcionRecurso } from "@/rules/resource-text";
import { crearPersonajeVacio } from "@/schemas/character";

describe("descripcionRecurso", () => {
  it("describe rasgos de orco en español", () => {
    const character = crearPersonajeVacio({
      name: "Grok",
      playerName: "",
      classId: "barbarian",
      speciesId: "orc",
      level: 3,
    });
    character.resources = [
      {
        id: "species:orc:relentless-endurance",
        name: "Perseverancia implacable",
        max: 1,
        used: 0,
        recharge: "long",
        source: "species",
        sourceLabel: "orc",
      },
      {
        id: "species:orc:adrenaline-rush",
        name: "Subidón de adrenalina",
        max: 2,
        used: 0,
        recharge: "short",
        source: "species",
        sourceLabel: "orc",
      },
    ];

    const aguante = descripcionRecurso(character, character.resources[0]!);
    const adrenalina = descripcionRecurso(character, character.resources[1]!);

    expect(aguante).toMatch(/1 punto de golpe/i);
    expect(adrenalina).toMatch(/correr|adrenalina/i);
  });

  it("describe rabia del bárbaro desde rasgos de clase", () => {
    const character = crearPersonajeVacio({
      name: "Rage",
      playerName: "",
      classId: "barbarian",
      level: 3,
    });
    const recurso = {
      id: "barbarian:rage",
      name: "Rabia",
      max: 3,
      used: 0,
      recharge: "long" as const,
      source: "class" as const,
      sourceLabel: "barbarian",
    };

    const desc = descripcionRecurso(character, recurso);
    expect(desc).toMatch(/rabia/i);
    expect(desc).toMatch(/ventaja/i);
  });
});
