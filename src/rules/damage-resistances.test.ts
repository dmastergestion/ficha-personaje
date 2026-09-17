import { describe, expect, it } from "vitest";
import { resistenciasEspecie, listaIncluyeTipoDano } from "@/rules/damage-resistances";
import { crearPersonajeVacio } from "@/schemas/character";
import { aplicarDeltaPvPersonaje } from "@/rules/combat-hp";

describe("resistenciasEspecie", () => {
  it("aasimar: necrótico y radiante", () => {
    expect(resistenciasEspecie("aasimar")).toEqual(["necrótico", "radiante"]);
  });

  it("enano: veneno", () => {
    expect(resistenciasEspecie("dwarf")).toEqual(["veneno"]);
  });

  it("dracónido según ancestro", () => {
    expect(resistenciasEspecie("dragonborn-red")).toEqual(["fuego"]);
    expect(resistenciasEspecie("dragonborn-blue")).toEqual(["eléctrico"]);
    expect(resistenciasEspecie("dragonborn")).toEqual([]);
  });

  it("tiflin según legado", () => {
    expect(resistenciasEspecie("tiefling-infernal")).toEqual(["fuego"]);
    expect(resistenciasEspecie("tiefling-abyssal")).toEqual(["veneno"]);
    expect(resistenciasEspecie("tiefling-chthonic")).toEqual(["necrótico"]);
  });

  it("humano y elfo no tienen resistencia de daño", () => {
    expect(resistenciasEspecie("human")).toEqual([]);
    expect(resistenciasEspecie("elf-high")).toEqual([]);
  });

  it("equipara relámpago y eléctrico", () => {
    expect(listaIncluyeTipoDano(["eléctrico"], "relámpago")).toBe(true);
  });
});

describe("aplicarDeltaPvPersonaje · resistencia racial", () => {
  it("el enano reduce a la mitad el daño de veneno", () => {
    const pj = crearPersonajeVacio({
      name: "E",
      playerName: "J",
      classId: "fighter",
      speciesId: "dwarf",
    });
    pj.combat.hpCurrent = 20;
    pj.combat.hpMax = 20;
    const result = aplicarDeltaPvPersonaje(pj, -10, { damageType: "veneno" });
    expect(result.character.combat.hpCurrent).toBe(15);
    expect(result.character.combat.damageResistances).toEqual([]);
  });

  it("el dracónido rojo reduce fuego; el relámpago no", () => {
    const pj = crearPersonajeVacio({
      name: "D",
      playerName: "J",
      classId: "fighter",
      speciesId: "dragonborn-red",
    });
    pj.combat.hpCurrent = 20;
    const fuego = aplicarDeltaPvPersonaje(pj, -10, { damageType: "fuego" });
    expect(fuego.character.combat.hpCurrent).toBe(15);
    const rayo = aplicarDeltaPvPersonaje(pj, -10, { damageType: "eléctrico" });
    expect(rayo.character.combat.hpCurrent).toBe(10);
  });

  it("el aasimar reduce necrótico y no persiste la resistencia", () => {
    const pj = crearPersonajeVacio({
      name: "A",
      playerName: "J",
      classId: "cleric",
      speciesId: "aasimar",
    });
    pj.combat.hpCurrent = 20;
    const result = aplicarDeltaPvPersonaje(pj, -10, { damageType: "necrótico" });
    expect(result.character.combat.hpCurrent).toBe(15);
    expect(result.character.combat.damageResistances).toEqual([]);
  });

  it("objetos sintonizados también reducen el daño", () => {
    const pj = crearPersonajeVacio({
      name: "M",
      playerName: "J",
      classId: "fighter",
      speciesId: "human",
    });
    pj.combat.hpCurrent = 20;
    pj.equipment.items = [
      {
        id: "anillo",
        name: "Anillo de resistencia",
        qty: 1,
        weightLb: 0,
        requiresAttunement: true,
        attuned: true,
        grantedResistances: ["frío"],
      },
    ];
    const result = aplicarDeltaPvPersonaje(pj, -10, { damageType: "frío" });
    expect(result.character.combat.hpCurrent).toBe(15);
  });
});
