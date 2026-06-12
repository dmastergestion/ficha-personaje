import { describe, expect, it } from "vitest";
import {
  maestriasArmasCompletas,
  ranurasMaestriaClase,
  resumenMaestriaArma,
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

  it("resume maestría con propiedad", () => {
    expect(resumenMaestriaArma("longsword")).toContain("Debilitar");
  });
});
