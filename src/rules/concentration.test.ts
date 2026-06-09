import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { cdConcentracion, tiradaConcentracionPorDanio } from "@/rules/concentration";
import { espaciosRestantesPersonaje } from "@/rules/rests";
import { lanzarConjuro } from "@/rules/spell-cast";

describe("cdConcentracion", () => {
  it("usa CD 10 o la mitad del daño (redondeado arriba), la que sea mayor", () => {
    expect(cdConcentracion(12)).toBe(10);
    expect(cdConcentracion(25)).toBe(13);
  });
});

describe("tiradaConcentracionPorDanio", () => {
  it("no hace nada si no hay concentración activa", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    expect(tiradaConcentracionPorDanio(character, 10, "normal")).toBeNull();
  });
});

describe("espaciosRestantesPersonaje", () => {
  it("muestra espacios disponibles, no gastados", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.spellSlotsUsed["1"] = 1;

    expect(espaciosRestantesPersonaje(character)["1"]).toBe(1);
  });
});

describe("lanzarConjuro concentración", () => {
  it("activa concentración al lanzar un conjuro que la requiere", () => {
    const character = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard" });
    character.spells.abilityKey = "int";

    const result = lanzarConjuro(character, 1, "normal", {
      spellId: "bless",
      requiereConcentracion: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.spells.concentratingOn).toBe("bless");
    expect(espaciosRestantesPersonaje(result.character)["1"]).toBe(1);
  });
});
