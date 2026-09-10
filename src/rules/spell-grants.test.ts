import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import {
  conjurosOtorgadosLanzables,
  conjurosOtorgadosPersonaje,
  filasConjurosFicha,
  mejorRecursoLibreParaConjuro,
  otorgamientoPorRecursoLibre,
  recursosConjurosOtorgados,
  purificarListasConjuro,
  vinculoRecursoConjuro,
  claseTieneEleccionesConjuro,
} from "@/rules/spell-grants";

describe("spell-grants", () => {
  it("linaje elfo drow concede conjuros por nivel", () => {
    let pj = crearPersonajeVacio({
      name: "Drow",
      playerName: "",
      classId: "fighter",
      speciesId: "elf-drow",
      level: 1,
    });
    pj.originChoices.species["lineage-casting-ability"] = "cha";
    expect(conjurosOtorgadosLanzables(pj).map((g) => g.spellId)).toEqual(["dancing-lights"]);

    pj = { ...pj, identity: { ...pj.identity, level: 3 } };
    const ids = conjurosOtorgadosLanzables(pj).map((g) => g.spellId);
    expect(ids).toContain("faerie-fire");
    expect(ids).toContain("dancing-lights");
  });

  it("paladín nivel 2 tiene castigo divino sin espacio", () => {
    const pj = poblarRecursosSugeridos(
      crearPersonajeVacio({
        name: "Pala",
        playerName: "",
        classId: "paladin",
        level: 2,
      }),
    );
    const smite = conjurosOtorgadosPersonaje(pj).find((g) => g.spellId === "divine-smite");
    expect(smite?.freeResourceId).toBe("class:paladin:divine-smite-free");
    expect(mejorRecursoLibreParaConjuro(pj, "divine-smite")).toBe(smite?.freeResourceId);
  });

  it("iniciado en la magia mantiene recurso de conjuro niv. 1", () => {
    const base = crearPersonajeVacio({ name: "MI", playerName: "", classId: "fighter", level: 1 });
    const pj = poblarRecursosSugeridos({
      ...base,
      feats: [
        {
          id: "magic-initiate",
          instanceId: "mi1",
          name: "Iniciado en la magia",
          choices: {
            "spell-list": "wizard",
            "spell-ability": "int",
            "cantrip-1": "fire-bolt",
            "cantrip-2": "mage-hand",
            "spell-1": "shield",
          },
        },
      ],
    });
    const grants = conjurosOtorgadosLanzables(pj);
    expect(grants.find((g) => g.spellId === "shield")?.freeResourceId).toBe("feat:mi1:free-cast-1");
    expect(recursosConjurosOtorgados(pj).some((r) => r.id === "feat:mi1:free-cast-1")).toBe(true);
  });

  it("resuelve conjuro desde id de recurso sin espacio", () => {
    const pj = poblarRecursosSugeridos(
      crearPersonajeVacio({
        name: "Alto",
        playerName: "",
        classId: "fighter",
        speciesId: "elf-high",
        level: 3,
      }),
    );
    pj.originChoices.species["lineage-casting-ability"] = "int";
    const recurso = pj.resources.find((r) => r.id === "species:elf-high:l3-free");
    expect(recurso).toBeDefined();
    const grant = otorgamientoPorRecursoLibre(pj, recurso!.id);
    expect(grant?.spellId).toBe("detect-magic");
    expect(grant?.grantId).toBe("species:elf-high:l3");
  });

  it("marcado por el feérico vincula paso brumoso al recurso", () => {
    const pj = poblarRecursosSugeridos({
      ...crearPersonajeVacio({ name: "Fey", playerName: "", classId: "fighter", level: 4 }),
      feats: [
        {
          id: "fey-touched",
          instanceId: "ft1",
          name: "Marcado por el feérico",
          choices: { "spell-1": "sleep" },
        },
      ],
    });
    const misty = pj.resources.find((r) => r.id === "feat:ft1:misty-step-free");
    expect(misty?.name).toContain("Paso brumoso");
    const vinculo = vinculoRecursoConjuro(pj, misty!.id);
    expect(vinculo?.spellId).toBe("misty-step");
    expect(vinculo?.anchor).toBe("conjuro-rasgo-feat:ft1:misty-step");
  });

  it("brujo archfey no muestra paso brumoso antes de nivel 3", () => {
    const base = crearPersonajeVacio({ name: "Lock", playerName: "", classId: "warlock", level: 1 });
    const pj = poblarRecursosSugeridos({
      ...base,
      identity: {
        ...base.identity,
        classes: [{ classId: "warlock", subclassId: "archfey", level: 1 }],
      },
    });
    expect(pj.resources.some((r) => r.id === "subclass:archfey:misty-step-free")).toBe(false);
    const pj3 = poblarRecursosSugeridos({
      ...pj,
      identity: {
        ...pj.identity,
        level: 3,
        classes: [{ classId: "warlock", subclassId: "archfey", level: 3 }],
      },
    });
    const recurso = pj3.resources.find((r) => r.id === "subclass:archfey:misty-step-free");
    expect(recurso).toBeDefined();
    expect(vinculoRecursoConjuro(pj3, recurso!.id)?.spellId).toBe("misty-step");
  });

  it("purifica listas persistidas quitando conjuros otorgados", () => {
    const pj = poblarRecursosSugeridos(
      crearPersonajeVacio({ name: "Pala", playerName: "", classId: "paladin", level: 2 }),
    );
    pj.spells.spellsPrepared = ["bless", "divine-smite"];
    const limpio = purificarListasConjuro(pj);
    expect(limpio.spells.spellsPrepared).toEqual(["bless"]);
  });

  it("todo recurso sin espacio con conjuro otorgado expone vínculo a hechizos", () => {
    const casos = [
      poblarRecursosSugeridos(
        crearPersonajeVacio({
          name: "Alto",
          playerName: "",
          classId: "fighter",
          speciesId: "elf-high",
          level: 5,
        }),
      ),
      poblarRecursosSugeridos(
        crearPersonajeVacio({ name: "Pala", playerName: "", classId: "paladin", level: 5 }),
      ),
      poblarRecursosSugeridos({
        ...crearPersonajeVacio({ name: "Lock", playerName: "", classId: "warlock", level: 5 }),
        identity: {
          ...crearPersonajeVacio({ name: "Lock", playerName: "", classId: "warlock", level: 5 })
            .identity,
          classes: [{ classId: "warlock", subclassId: "archfey", level: 5 }],
        },
      }),
    ];

    for (const pj of casos) {
      for (const r of recursosConjurosOtorgados(pj)) {
        const grant = otorgamientoPorRecursoLibre(pj, r.id);
        if (!grant?.spellId) continue;
        const vinculo = vinculoRecursoConjuro(pj, r.id);
        expect(vinculo?.spellId).toBe(grant.spellId);
        expect(vinculo?.anchor).toMatch(/^conjuro-rasgo-/);
      }
    }
  });

  it("arcanum de brujo usa elección de clase", () => {
    const pj = poblarRecursosSugeridos({
      ...crearPersonajeVacio({ name: "Lock", playerName: "", classId: "warlock", level: 11 }),
      identity: {
        ...crearPersonajeVacio({ name: "Lock", playerName: "", classId: "warlock", level: 11 })
          .identity,
        classes: [{ classId: "warlock", subclassId: "fiend", level: 11 }],
      },
      originChoices: {
        species: {},
        background: {},
        class: { "arcanum-6": "circle-of-death" },
      },
    });
    const arcanum = conjurosOtorgadosLanzables(pj).find((g) => g.grantId.includes("arcanum-6"));
    expect(arcanum?.spellId).toBe("circle-of-death");
  });

  it("mete conjuros de rasgo en las listas de trucos y hechizos", () => {
    const base = crearPersonajeVacio({
      name: "Alto",
      playerName: "",
      classId: "fighter",
      speciesId: "elf-high",
      level: 3,
    });
    const pj = poblarRecursosSugeridos({
      ...base,
      originChoices: {
        ...base.originChoices,
        species: { "lineage-casting-ability": "int" },
      },
    });
    const trucos = filasConjurosFicha(pj, [], "cantrip");
    expect(trucos.some((f) => f.spellId === "prestidigitation")).toBe(true);
    expect(trucos.find((f) => f.spellId === "prestidigitation")?.sePuedeQuitar).toBe(false);
    expect(trucos.find((f) => f.spellId === "prestidigitation")?.anotacion).toMatch(/Especie/);

    const hechizos = filasConjurosFicha(pj, ["shield"], "leveled");
    expect(hechizos.map((f) => f.spellId)).toContain("detect-magic");
    expect(hechizos.map((f) => f.spellId)).toContain("shield");
    const detectar = hechizos.find((f) => f.spellId === "detect-magic");
    expect(detectar?.sePuedeQuitar).toBe(false);
    expect(detectar?.anotacion).toMatch(/Especie/);
    expect(detectar?.usosLibres).toEqual({ restantes: 1, max: 1 });
    expect(hechizos.find((f) => f.spellId === "shield")?.sePuedeQuitar).toBe(true);
  });

  it("solo pide lista de conjuros si la clase tiene elecciones dinámicas", () => {
    expect(claseTieneEleccionesConjuro("fighter", [{ classId: "fighter", subclassId: null, level: 5 }])).toBe(
      false,
    );
    expect(claseTieneEleccionesConjuro("warlock", [{ classId: "warlock", subclassId: null, level: 5 }])).toBe(
      false,
    );
    expect(claseTieneEleccionesConjuro("warlock", [{ classId: "warlock", subclassId: null, level: 11 }])).toBe(
      true,
    );
  });

  it("alto elfo y archifey apilan usos gratis de paso brumoso", () => {
    const base = crearPersonajeVacio({
      name: "Lock",
      playerName: "",
      classId: "warlock",
      speciesId: "elf-high",
      level: 5,
    });
    const pj = poblarRecursosSugeridos({
      ...base,
      abilities: { ...base.abilities, cha: 16 },
      originChoices: {
        ...base.originChoices,
        species: { "lineage-casting-ability": "cha" },
      },
      identity: {
        ...base.identity,
        level: 5,
        classes: [{ classId: "warlock", subclassId: "archfey", level: 5 }],
      },
    });
    const elfo = pj.resources.find((r) => r.id === "species:elf-high:l5-free");
    const archifey = pj.resources.find((r) => r.id === "subclass:archfey:misty-step-free");
    expect(elfo?.max).toBe(1);
    expect(archifey?.max).toBe(3);
    const fila = filasConjurosFicha(pj, [], "leveled").find((f) => f.spellId === "misty-step");
    expect(fila?.usosLibres).toBeUndefined();
    expect(fila?.usosPorOrigen).toEqual([
      expect.objectContaining({
        resourceId: "species:elf-high:l5-free",
        source: "species",
        restantes: 1,
        max: 1,
      }),
      expect.objectContaining({
        resourceId: "subclass:archfey:misty-step-free",
        source: "subclass",
        restantes: 3,
        max: 3,
      }),
    ]);
    expect(fila?.anotacion).toMatch(/Especie/);
    expect(fila?.anotacion).toMatch(/Subclase/);
    expect(elfo?.name).toMatch(/Especie/);
    expect(archifey?.name).toMatch(/Subclase/);

    const gastadoElfo = {
      ...pj,
      resources: pj.resources.map((r) =>
        r.id === "species:elf-high:l5-free" ? { ...r, used: 1 } : r,
      ),
    };
    const trasGasto = filasConjurosFicha(gastadoElfo, [], "leveled").find(
      (f) => f.spellId === "misty-step",
    );
    expect(trasGasto?.usosPorOrigen?.find((u) => u.source === "species")?.restantes).toBe(0);
    expect(trasGasto?.usosPorOrigen?.find((u) => u.source === "subclass")?.restantes).toBe(3);
  });
});
