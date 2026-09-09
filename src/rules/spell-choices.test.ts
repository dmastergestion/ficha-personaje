import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { idsConjurosAsignados } from "@/rules/spell-grants";
import {
  conjuroVisibleEnEleccion,
  deltaRequisitosSubida,
  idsOcupadosSelectorConjuros,
  requisitosConjurosClases,
  seleccionConjurosCompleta,
  validarSeleccionConjuros,
} from "@/rules/spell-choices";

describe("requisitosConjurosClases", () => {
  it("mago nivel 1: 3 trucos, 6 grimorio, 4 preparados", () => {
    expect(
      requisitosConjurosClases([{ classId: "wizard", subclassId: null, level: 1 }]),
    ).toEqual({ cantrips: 3, grimorio: 6, preparados: 4 });
  });

  it("bardo nivel 1: 2 trucos y 4 preparados", () => {
    expect(
      requisitosConjurosClases([{ classId: "bard", subclassId: null, level: 1 }]),
    ).toEqual({ cantrips: 2, grimorio: 0, preparados: 4 });
  });

  it("guerrero no pide conjuros", () => {
    expect(
      requisitosConjurosClases([{ classId: "fighter", subclassId: null, level: 1 }]),
    ).toEqual({ cantrips: 0, grimorio: 0, preparados: 0 });
  });
});

describe("validarSeleccionConjuros", () => {
  const clases = [{ classId: "wizard" as const, subclassId: null, level: 1 }];

  it("exige grimorio completo antes de preparados válidos", () => {
    const msg = validarSeleccionConjuros(clases, {
      cantripsKnown: ["light", "mage-hand", "ray-of-frost"],
      spellsKnown: ["magic-missile"],
      spellsPrepared: ["magic-missile"],
    });
    expect(msg).toMatch(/grimorio/i);
  });

  it("acepta selección completa de mago", () => {
    const seleccion = {
      cantripsKnown: ["light", "mage-hand", "ray-of-frost"],
      spellsKnown: [
        "detect-magic",
        "feather-fall",
        "mage-armor",
        "magic-missile",
        "sleep",
        "thunderwave",
      ],
      spellsPrepared: ["magic-missile", "sleep", "mage-armor", "detect-magic"],
    };
    expect(validarSeleccionConjuros(clases, seleccion)).toBeNull();
    expect(seleccionConjurosCompleta(clases, seleccion)).toBe(true);
  });
});

describe("deltaRequisitosSubida", () => {
  it("mago 1→2 gana 1 preparado y 2 grimorio", () => {
    const antes = [{ classId: "wizard", subclassId: null, level: 1 }];
    const despues = [{ classId: "wizard", subclassId: null, level: 2 }];
    expect(deltaRequisitosSubida(antes, despues)).toEqual({
      cantrips: 0,
      grimorio: 2,
      preparados: 1,
    });
  });
});

describe("conjuroVisibleEnEleccion", () => {
  const mago = { classId: "wizard", subclassId: null, level: 1 };

  it("oculta conjuros que no están en la lista de la clase", () => {
    expect(
      conjuroVisibleEnEleccion({
        spellId: "cure-wounds",
        spellLevel: 1,
        clase: mago,
        lista: "preparados",
        idsOcupados: new Set(),
      }),
    ).toBe(false);
  });

  it("oculta un conjuro ya concedido por rasgo, incluso con id alias", () => {
    const ocupados = idsOcupadosSelectorConjuros(
      { cantripsKnown: [], spellsKnown: [], spellsPrepared: [] },
      ["hideous-laughter"],
    );
    expect(
      conjuroVisibleEnEleccion({
        spellId: "tashas-hideous-laughter",
        spellLevel: 1,
        clase: mago,
        lista: "preparados",
        idsOcupados: ocupados,
      }),
    ).toBe(false);
  });

  it("mago ve risa horrible en grimorio si no la tiene", () => {
    expect(
      conjuroVisibleEnEleccion({
        spellId: "hideous-laughter",
        spellLevel: 1,
        clase: mago,
        lista: "grimorio",
        idsOcupados: new Set(),
      }),
    ).toBe(true);
  });
});

describe("idsConjurosAsignados alias", () => {
  it("drow con luces danzantes ocupa el id y no deja repetirlo", () => {
    const pj = crearPersonajeVacio({
      name: "Drow",
      playerName: "",
      classId: "wizard",
      speciesId: "elf-drow",
      level: 1,
    });
    pj.originChoices.species["lineage-casting-ability"] = "cha";
    const ids = idsConjurosAsignados(pj);
    expect(ids.has("dancing-lights")).toBe(true);
  });
});
