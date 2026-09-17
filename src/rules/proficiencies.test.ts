import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  esCompetenteConArma,
  etiquetaCompetenciaArma,
  etiquetaListaCompetenciasHerramientas,
  proficienciasIniciales,
} from "@/rules/proficiencies";

describe("etiquetas de competencia", () => {
  it("traduce armas al español", () => {
    expect(etiquetaCompetenciaArma("simple")).toBe("Simples");
    expect(etiquetaCompetenciaArma("martial")).toBe("Marciales");
    expect(etiquetaCompetenciaArma("martial (light)")).toBe("Marciales (ligeras)");
  });

  it("traduce herramientas al español", () => {
    expect(etiquetaListaCompetenciasHerramientas(["calligrapher's supplies"])).toBe(
      "Suministros de calígrafo",
    );
  });
});

describe("proficienciasIniciales", () => {
  it("asigna salvaciones de clase", () => {
    const { savingThrows } = proficienciasIniciales("fighter");
    expect(savingThrows).toEqual(["str", "con"]);
  });

  it("añade pericias de trasfondo", () => {
    const { skills } = proficienciasIniciales("wizard", ["arcana", "history"]);
    expect(skills).toEqual(["arcana", "history"]);
  });

  it("el mago parte con armas simples", () => {
    const { weaponProficiencies } = proficienciasIniciales("wizard");
    expect(weaponProficiencies).toContain("simple");
  });
});

describe("esCompetenteConArma", () => {
  it("mago no es competente con espada larga", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.proficiencies.weaponProficiencies = ["simple"];
    expect(esCompetenteConArma(pj, "longsword")).toBe(false);
    expect(esCompetenteConArma(pj, "mace")).toBe(true);
  });

  it("lista vacía de armas no implica competente en todo", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.proficiencies.weaponProficiencies = [];
    expect(esCompetenteConArma(pj, "longsword")).toBe(false);
    expect(esCompetenteConArma(pj, "mace")).toBe(false);
  });

  it("pícaro no es competente con mandoble", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "rogue" });
    pj.proficiencies.weaponProficiencies = ["simple", "martial (finesse/light)"];
    expect(esCompetenteConArma(pj, "greatsword")).toBe(false);
    expect(esCompetenteConArma(pj, "shortsword")).toBe(true);
    expect(esCompetenteConArma(pj, "rapier")).toBe(true);
  });

  it("monje es competente con marciales ligeras", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "monk" });
    pj.proficiencies.weaponProficiencies = ["simple", "martial (light)"];
    expect(esCompetenteConArma(pj, "shortsword")).toBe(true);
    expect(esCompetenteConArma(pj, "greatsword")).toBe(false);
  });

  it("guerrero es competente con todas las marciales", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.proficiencies.weaponProficiencies = ["simple", "martial"];
    expect(esCompetenteConArma(pj, "greatsword")).toBe(true);
    expect(esCompetenteConArma(pj, "mace")).toBe(true);
  });
});

describe("pericias de clase", () => {
  it("fusiona origen y elecciones de clase", () => {
    const { skills } = proficienciasIniciales(
      "fighter",
      ["perception"],
      [],
      ["athletics", "insight"],
    );
    expect(skills).toEqual(["perception", "athletics", "insight"]);
  });
});
