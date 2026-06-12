import { describe, expect, it } from "vitest";
import {
  bonificadoresDesdeElecciones,
  eleccionesEspecie,
  eleccionesOrigenCompletas,
  esEleccionEditable,
  fusionarEleccionesOrigen,
} from "@/rules/origin-choices";

describe("origin-choices", () => {
  it("incluye revelación celestial para aasimar", () => {
    const defs = eleccionesEspecie("aasimar");
    expect(defs.some((d) => d.id === "celestial-revelation")).toBe(true);
    expect(defs.some((d) => d.id === "size")).toBe(true);
  });

  it("incluye dote versátil para humano", () => {
    const defs = eleccionesEspecie("human");
    const versatile = defs.find((d) => d.id === "versatile-feat")!;
    expect(versatile).toBeDefined();
    expect(versatile.options.some((o) => o.value === "alert")).toBe(true);
    expect(versatile.options.some((o) => o.value === "skilled")).toBe(true);
  });

  it("bloquea revelación celestial a partir de nivel 3", () => {
    const def = eleccionesEspecie("aasimar").find((d) => d.id === "celestial-revelation")!;
    expect(esEleccionEditable(def, 2)).toBe(true);
    expect(esEleccionEditable(def, 3)).toBe(false);
  });

  it("aplica modo +1/+1/+1 del trasfondo", () => {
    const traits =
      "Ability Scores:: Strength, Intelligence, Charisma Feat:: Skilled Skill Proficiencies:: History, Persuasion";
    const bonuses = bonificadoresDesdeElecciones(traits, {
      species: {},
      background: { "ability-mode": "even" },
      class: {},
    });
    expect(bonuses).toEqual({ str: 1, int: 1, cha: 1 });
  });

  it("valida elecciones completas", () => {
    const choices = fusionarEleccionesOrigen("aasimar", "noble", undefined, {
      background: {
        skillProficiencies: ["history", "persuasion"],
        toolProficiencies: ["Choose one kind of Gaming Set"],
        feat: "Skilled",
        traits:
          "Ability Scores:: Strength, Intelligence, Charisma Feat:: Skilled Skill Proficiencies:: History, Persuasion Tool Proficiency:: Choose one kind of Gaming Set Equipment:: Choose A or B: (A) Gaming Set 29 GP; or (B) 50 GP",
      },
    });
    expect(
      eleccionesOrigenCompletas("aasimar", "noble", choices, {
        background: {
          skillProficiencies: ["history", "persuasion"],
          toolProficiencies: ["Choose one kind of Gaming Set"],
          feat: "Skilled",
          traits:
            "Ability Scores:: Strength, Intelligence, Charisma Feat:: Skilled Skill Proficiencies:: History, Persuasion Tool Proficiency:: Choose one kind of Gaming Set Equipment:: Choose A or B: (A) Gaming Set 29 GP; or (B) 50 GP",
        },
      }),
    ).toBe(true);
  });
});
