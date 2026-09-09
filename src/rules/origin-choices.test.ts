import { describe, expect, it } from "vitest";
import {
  bonificadoresDesdeElecciones,
  eleccionesEspecie,
  eleccionesOrigenCompletas,
  esEleccionEditable,
  fusionarEleccionesOrigen,
  opcionesEleccionOrigen,
} from "@/rules/origin-choices";

describe("origin-choices", () => {
  it("incluye revelación celestial para aasimar", () => {
    const defs = eleccionesEspecie("aasimar");
    expect(defs.some((d) => d.id === "celestial-revelation")).toBe(true);
    expect(defs.some((d) => d.id === "size")).toBe(true);
  });

  it("incluye atributo de conjuros de linaje para elfo", () => {
    const defs = eleccionesEspecie("elf-high");
    expect(defs.some((d) => d.id === "lineage-casting-ability")).toBe(true);
    expect(defs.some((d) => d.id === "keen-senses")).toBe(true);
    expect(defs.some((d) => d.id === "extra-language")).toBe(true);
  });

  it("incluye dote versátil e idioma extra para humano", () => {
    const defs = eleccionesEspecie("human");
    const versatile = defs.find((d) => d.id === "versatile-feat")!;
    expect(versatile).toBeDefined();
    expect(versatile.options.some((o) => o.value === "alert")).toBe(true);
    expect(versatile.options.some((o) => o.value === "skilled")).toBe(true);
    expect(defs.some((d) => d.id === "extra-language")).toBe(true);
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

  it("no deja repetir Perspicacia si el trasfondo ya la otorga", () => {
    const catalogo = {
      background: {
        skillProficiencies: ["insight", "religion"],
        feat: "magic initiate — cleric",
        traits:
          "Ability Scores:: Intelligence, Wisdom, Charisma Feat:: Magic Initiate Skill Proficiencies:: Insight, Religion",
      },
    };
    const fused = fusionarEleccionesOrigen(
      "elf-high",
      "acolyte",
      { species: { "keen-senses": "insight" }, background: {}, class: {} },
      catalogo,
    );
    expect(fused.species["keen-senses"]).not.toBe("insight");
    expect(["perception", "survival"]).toContain(fused.species["keen-senses"]);

    const defs = eleccionesEspecie("elf-high");
    const keen = defs.find((d) => d.id === "keen-senses")!;
    const opciones = opcionesEleccionOrigen(keen, fused, "acolyte", catalogo);
    expect(opciones.some((o) => o.value === "insight")).toBe(false);

    const invalidas = {
      ...fused,
      species: { ...fused.species, "keen-senses": "insight" },
    };
    expect(eleccionesOrigenCompletas("elf-high", "acolyte", invalidas, catalogo)).toBe(false);
    expect(eleccionesOrigenCompletas("elf-high", "acolyte", fused, catalogo)).toBe(true);
  });

  it("no deja repetir la dote de origen si el trasfondo ya la otorga", () => {
    const fused = fusionarEleccionesOrigen("human", "criminal", undefined);
    expect(fused.species["versatile-feat"]).not.toBe("alert");
  });
});
