import { describe, expect, it } from "vitest";
import { bonificadorCompetencia } from "@/rules/ability";
import { modificadorPericia, modificadorSalvacion, velocidad } from "@/rules/character";
import { crearPersonajeVacio } from "@/schemas/character";

describe("modificadorPericia", () => {
  it("expertise duplica el PB", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "rogue" });
    pj.proficiencies.skills = ["stealth"];
    pj.proficiencies.expertise = ["stealth"];
    pj.abilities.dex = 16;
    expect(modificadorPericia(pj, "stealth")).toBe(3 + bonificadorCompetencia(1) * 2);
  });

  it("Jack of All Trades suma la mitad del PB sin competencia (bardo 2+)", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "bard" });
    pj.identity.level = 2;
    pj.identity.classes = [{ classId: "bard", subclassId: null, level: 2 }];
    pj.abilities.int = 10;
    expect(modificadorPericia(pj, "arcana")).toBe(Math.floor(bonificadorCompetencia(2) / 2));
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

describe("velocidad", () => {
  it("resta 5 pies por nivel de agotamiento 2024", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "fighter" });
    pj.combat.exhaustionLevel = 3;
    expect(velocidad(pj, 30)).toBe(15);
  });

  it("resta 10 pies si la armadura pesada exige más Fuerza", () => {
    const pj = crearPersonajeVacio({ name: "Test", playerName: "J", classId: "fighter" });
    pj.abilities.str = 10;
    pj.equipment.armorId = "chain-mail";
    expect(velocidad(pj, 30)).toBe(20);
  });
});
