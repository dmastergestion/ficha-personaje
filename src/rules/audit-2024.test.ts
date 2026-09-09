import { describe, expect, it } from "vitest";
import { extrasAtaque } from "@/rules/attacks";
import { velocidad } from "@/rules/character";
import {
  aplicarCompetenciasOrdenDivino,
  extraTrucosOrdenDivino,
} from "@/rules/class-equipment";
import { nivelSubclase, rasgosDeSubclase } from "@/rules/class-features";
import { aplicarCambioPv } from "@/rules/combat-hp";
import { cdConcentracion } from "@/rules/concentration";
import { crearPersonajeDesdeAsistente } from "@/rules/creation";
import {
  clampIndicePaso,
  validarAsignacionAtributos,
  validarEstiloCombateCreacion,
  validarMejorasCreacion,
} from "@/rules/creation-wizard";
import { tirarSalvacionMuerte } from "@/rules/death-saves";
import { calcularModificadoresCondiciones } from "@/rules/effects";
import { aplicarSubidaNivel } from "@/rules/level-up";
import { faltaElegirSubclase } from "@/rules/multiclass";
import { idiomasEspecie } from "@/rules/origin-benefits";
import { competenciasClase, esCompetenteConArma, proficienciasIniciales } from "@/rules/proficiencies";
import { ajustarPgPorCambioCon } from "@/rules/resources";
import { crearPersonajeVacio } from "@/schemas/character";

describe("auditoría 2024 — IDs y PG", () => {
  it("rasgosDeSubclase('hand') no está vacío (alias open-hand)", () => {
    expect(rasgosDeSubclase("hand").length).toBeGreaterThan(0);
    expect(rasgosDeSubclase("open-hand").length).toBeGreaterThan(0);
  });

  it("Tough + enano en creación suman PG", () => {
    const farmer = crearPersonajeDesdeAsistente({
      name: "Gimli",
      playerName: "J",
      speciesId: "dwarf",
      backgroundId: "farmer",
      classId: "fighter",
      subclassId: null,
      level: 1,
      abilities: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
    });
    expect(farmer.feats.some((f) => f.id === "tough")).toBe(true);
    expect(farmer.combat.hpMax).toBeGreaterThanOrEqual(10 + 2 + 1 + 2);
  });

  it("aplicarSubidaNivel suma PG de enano y Tough", () => {
    const pj = crearPersonajeVacio({ name: "D", playerName: "J", classId: "fighter", speciesId: "dwarf" });
    pj.feats = [{ id: "tough", name: "Robustez" }];
    pj.combat.hpMax = 15;
    pj.combat.hpCurrent = 15;
    const next = aplicarSubidaNivel(
      pj,
      [{ classId: "fighter", subclassId: null, level: 2 }],
      7,
      true,
    );
    expect(next.combat.hpMax).toBe(15 + 7 + 1 + 2);
  });

  it("delta CON 14→16 sube hpMax × nivel", () => {
    const pj = crearPersonajeVacio({ name: "C", playerName: "J", classId: "fighter" });
    pj.identity.level = 5;
    pj.identity.classes = [{ classId: "fighter", subclassId: null, level: 5 }];
    pj.abilities.con = 14;
    pj.combat.hpMax = 40;
    pj.combat.hpCurrent = 40;
    const next = ajustarPgPorCambioCon(pj, 14, 16);
    expect(next.combat.hpMax).toBe(45);
  });
});

describe("auditoría 2024 — combate", () => {
  it("rabia da daño y no ventaja de ataque; temerario sí", () => {
    const pj = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian" });
    pj.identity.classes = [{ classId: "barbarian", subclassId: null, level: 3 }];
    pj.combat.raging = true;
    pj.combat.reckless = false;
    const attack = {
      id: "a1",
      name: "Hacha",
      abilityKey: "str" as const,
      proficient: true,
      weaponId: "greataxe",
    };
    const rabia = extrasAtaque(pj, attack);
    expect(rabia.damage).toBeGreaterThan(0);
    expect(rabia.ventaja).toBe(false);
    pj.combat.reckless = true;
    expect(extrasAtaque(pj, attack).ventaja).toBe(true);
  });

  it("curar desde 0 y 20 natural: +1 agotamiento; 20 quita inconsciente", () => {
    const combat = {
      ...crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat,
      hpCurrent: 0,
      conditionIds: ["unconscious" as const],
    };
    const curado = aplicarCambioPv(combat, 4);
    expect(curado.exhaustionLevel).toBe(1);
    expect(curado.conditionIds.includes("unconscious")).toBe(false);

    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.combat.hpCurrent = 0;
    pj.combat.conditionIds = ["unconscious"];
    const result = tirarSalvacionMuerte(pj, "normal", {
      source: "physical",
      manual: { die1: 20 },
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.character.combat.hpCurrent).toBe(1);
    expect(result.character.combat.exhaustionLevel).toBe(1);
    expect(result.character.combat.conditionIds.includes("unconscious")).toBe(false);
  });

  it("Restringido: desventaja de salvación solo DES", () => {
    const mods = calcularModificadoresCondiciones(["restrained"]);
    expect([...mods.salvacionDesventaja]).toEqual(["dex"]);
    expect(mods.desventajaSalvaciones).toBe(false);
  });

  it("CD concentración: 21 daño → 10", () => {
    expect(cdConcentracion(21)).toBe(10);
  });
});

describe("auditoría 2024 — origen y clase", () => {
  it("brujo 1 sin subclase es válido; brujo 3 la exige", () => {
    expect(nivelSubclase("warlock")).toBe(3);
    expect(faltaElegirSubclase({ classId: "warlock", subclassId: null, level: 1 })).toBe(false);
    expect(faltaElegirSubclase({ classId: "warlock", subclassId: null, level: 3 })).toBe(true);
  });

  it("Orden divino protector añade pesada y marcial", () => {
    const base = competenciasClase("cleric");
    const next = aplicarCompetenciasOrdenDivino(
      "cleric",
      { species: {}, background: {}, class: { "divine-order": "protector" } },
      base.armorProficiencies,
      base.weaponProficiencies,
    );
    expect(next.armorProficiencies).toContain("heavy");
    expect(next.weaponProficiencies).toContain("martial");
    expect(extraTrucosOrdenDivino("cleric", { species: {}, background: {}, class: { "divine-order": "thaumaturge" } })).toBe(1);
  });

  it("idiomas de especie no están vacíos", () => {
    expect(idiomasEspecie("dwarf")).toEqual(["Común", "Enano"]);
    expect(idiomasEspecie("human", { species: { "extra-language": "Élfico" }, background: {}, class: {} })).toContain("Élfico");
  });

  it("bárbaro 5 sin pesada gana +10 velocidad", () => {
    const pj = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian" });
    pj.identity.classes = [{ classId: "barbarian", subclassId: null, level: 5 }];
    pj.equipment.armorId = null;
    expect(velocidad(pj, 30)).toBe(40);
  });
});

describe("auditoría 2024 — asistente", () => {
  it("clamp de paso cuando se acorta la lista", () => {
    expect(clampIndicePaso(5, 4)).toBe(3);
    expect(clampIndicePaso(-1, 3)).toBe(0);
  });

  it("4d6/array incompletos fallan la validación", () => {
    expect(
      validarAsignacionAtributos({
        modo: "array",
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        tiradas4d6: null,
        asignacion4d6: {},
        asignacionArray: { str: 0 },
      }),
    ).toMatch(/array/i);
    expect(
      validarAsignacionAtributos({
        modo: "4d6",
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        tiradas4d6: null,
        asignacion4d6: {},
        asignacionArray: {},
      }),
    ).toMatch(/4d6/i);
  });

  it("exige estilo de combate al crear guerrero", () => {
    expect(validarEstiloCombateCreacion("fighter", 1, null)).toMatch(/estilo/i);
    expect(validarEstiloCombateCreacion("fighter", 1, "archery")).toBeNull();
    expect(validarMejorasCreacion([], 1)).toMatch(/ASI|dote/i);
  });
});

describe("auditoría 2024 — competencias", () => {
  it("lista vacía de armas no implica competente en todo", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.proficiencies.weaponProficiencies = [];
    expect(esCompetenteConArma(pj, "longsword")).toBe(false);
    expect(esCompetenteConArma(pj, "mace")).toBe(false);
  });

  it("proficienciasIniciales sigue dando simples al mago", () => {
    const { weaponProficiencies } = proficienciasIniciales("wizard");
    expect(weaponProficiencies.length).toBeGreaterThan(0);
  });
});
