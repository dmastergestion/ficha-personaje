import { describe, expect, it } from "vitest";
import {
  maestriasArmasCompletas,
  maxRecursoPorFormula,
  ranurasMaestriaClase,
  resumenMaestriaArma,
  textoMaestriaArma,
} from "@/rules/weapon-mastery";
import { proficienciasIniciales } from "@/rules/proficiencies";
import { crearPersonajeVacio } from "@/schemas/character";

describe("weapon-mastery", () => {
  it("guerrero nivel 1 tiene 3 ranuras", () => {
    expect(ranurasMaestriaClase("fighter", 1)).toBe(3);
    expect(ranurasMaestriaClase("paladin", 1)).toBe(2);
  });

  it("valida maestrías completas", () => {
    const base = crearPersonajeVacio({ name: "Pala", playerName: "", classId: "paladin", level: 1 });
    const profs = proficienciasIniciales("paladin");
    let character = {
      ...base,
      identity: {
        ...base.identity,
        classes: [{ classId: "paladin", subclassId: null, level: 1 }],
      },
      proficiencies: { ...base.proficiencies, weaponProficiencies: profs.weaponProficiencies },
      weaponMasteries: ["longsword", "javelin"],
    };
    expect(maestriasArmasCompletas(character)).toBe(true);

    character = { ...character, weaponMasteries: ["longsword"] };
    expect(maestriasArmasCompletas(character)).toBe(false);
  });

  it("resume maestría con propiedad del catálogo", () => {
    expect(resumenMaestriaArma("longsword")).toContain("Debilitar");
    expect(textoMaestriaArma("longsword")?.descripcion).toMatch(/desventaja/i);
  });

  it("fórmulas de recurso: 2pb y max(1,wis)", () => {
    expect(maxRecursoPorFormula("2pb", 5)).toBe(6);
    expect(maxRecursoPorFormula("max(1,wis)", 1, { wis: 16 })).toBe(3);
    expect(maxRecursoPorFormula("1+level", 3)).toBe(4);
  });
});
