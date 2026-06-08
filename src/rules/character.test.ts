import { describe, expect, it } from "vitest";
import { bonificadorCompetencia } from "@/rules/ability";
import { modificadorPericia, modificadorSalvacion } from "@/rules/character";
import { crearPersonajeVacio } from "@/schemas/character";

describe("modificadorPericia", () => {
  it("suma PB si la pericia es proficiente", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "fighter" });
    pj.proficiencies.skills = ["athletics"];
    pj.abilities.str = 16;
    expect(modificadorPericia(pj, "athletics")).toBe(3 + bonificadorCompetencia(1));
  });
});

describe("modificadorSalvacion", () => {
  it("suma PB en salvación proficiente", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "fighter" });
    pj.proficiencies.savingThrows = ["str"];
    pj.abilities.str = 14;
    expect(modificadorSalvacion(pj, "str")).toBe(2 + bonificadorCompetencia(1));
  });
});
