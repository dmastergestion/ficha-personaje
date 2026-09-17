import { describe, expect, it } from "vitest";
import { poblarRecursosSugeridos, recursosSugeridos } from "@/rules/resources-tracker";
import { crearPersonajeVacio } from "@/schemas/character";

describe("recursosSugeridos", () => {
  it("incluye conocimiento pétreo para enanos", () => {
    const character = crearPersonajeVacio({
      name: "Thorin",
      playerName: "",
      classId: "fighter",
      speciesId: "dwarf",
      level: 3,
    });
    character.identity.classes = [{ classId: "fighter", subclassId: null, level: 3 }];
    const recursos = recursosSugeridos(character);
    const stone = recursos.find((r) => r.id.includes("stonecunning"));
    expect(stone).toBeDefined();
    expect(stone!.name).toBe("Conocimiento pétreo");
    expect(stone!.source).toBe("species");
    expect(stone!.max).toBe(2);
  });

  it("incluye recursos de clase y especie", () => {
    const character = crearPersonajeVacio({
      name: "Guerrero",
      playerName: "",
      classId: "fighter",
      speciesId: "dwarf",
      level: 1,
    });
    character.identity.classes = [{ classId: "fighter", subclassId: null, level: 1 }];
    const recursos = recursosSugeridos(character);
    expect(recursos.some((r) => r.source === "class")).toBe(true);
    expect(recursos.some((r) => r.source === "species")).toBe(true);
  });

  it("elimina el recurso obsoleto de enemigo favorecido del explorador", () => {
    const base = crearPersonajeVacio({
      name: "Ranger",
      playerName: "",
      classId: "ranger",
      level: 1,
    });
    const pj = poblarRecursosSugeridos({
      ...base,
      resources: [
        {
          id: "ranger:favored-enemy",
          name: "Enemigo favorecido",
          max: 2,
          used: 1,
          recharge: "long",
          source: "class",
        },
      ],
    });
    expect(pj.resources.some((r) => r.id === "ranger:favored-enemy")).toBe(false);
    expect(pj.resources.some((r) => r.id === "class:ranger:hunters-mark-free")).toBe(true);
  });

  it("vuelo dracónico y forma grande son 1/descanso largo (PHB 2024)", () => {
    const dragon = crearPersonajeVacio({
      name: "Draco",
      playerName: "",
      classId: "fighter",
      speciesId: "dragonborn-red",
      level: 5,
    });
    dragon.identity.classes = [{ classId: "fighter", subclassId: null, level: 5 }];
    const vuelo = recursosSugeridos(dragon).find((r) => r.id.includes("draconic-flight"));
    expect(vuelo?.max).toBe(1);

    const goliat = crearPersonajeVacio({
      name: "Gol",
      playerName: "",
      classId: "fighter",
      speciesId: "goliath-stone-giant",
      level: 5,
    });
    goliat.identity.classes = [{ classId: "fighter", subclassId: null, level: 5 }];
    const forma = recursosSugeridos(goliat).find((r) => r.id.includes("large-form"));
    expect(forma?.max).toBe(1);
  });

  it("guerrero 9 obtiene Indomable; no antes", () => {
    const bajo = crearPersonajeVacio({
      name: "G",
      playerName: "",
      classId: "fighter",
      level: 8,
    });
    bajo.identity.classes = [{ classId: "fighter", subclassId: null, level: 8 }];
    expect(recursosSugeridos(bajo).some((r) => r.id === "fighter:indomitable")).toBe(false);

    const alto = { ...bajo, identity: { ...bajo.identity, level: 9, classes: [{ classId: "fighter", subclassId: null, level: 9 }] } };
    const indomable = recursosSugeridos(alto).find((r) => r.id === "fighter:indomitable");
    expect(indomable?.max).toBe(1);
  });

  it("celoso rastrea el grupo de d12; el berserker no", () => {
    const zealot = crearPersonajeVacio({
      name: "Z",
      playerName: "",
      classId: "barbarian",
      level: 3,
    });
    zealot.identity.classes = [{ classId: "barbarian", subclassId: "zealot", level: 3 }];
    zealot.identity.subclassId = "zealot";
    const pool = recursosSugeridos(zealot).find((r) => r.id === "barbarian:warrior-of-the-gods");
    expect(pool?.max).toBe(4);
    expect(pool?.source).toBe("subclass");

    const berserker = {
      ...zealot,
      identity: {
        ...zealot.identity,
        subclassId: "berserker",
        classes: [{ classId: "barbarian", subclassId: "berserker", level: 3 }],
      },
    };
    expect(recursosSugeridos(berserker).some((r) => r.id === "barbarian:warrior-of-the-gods")).toBe(
      false,
    );
  });

  it("explorador 10 con SAB 16 tiene 3 usos de Incansable", () => {
    const pj = crearPersonajeVacio({
      name: "R",
      playerName: "",
      classId: "ranger",
      level: 10,
    });
    pj.identity.classes = [{ classId: "ranger", subclassId: null, level: 10 }];
    pj.abilities.wis = 16;
    const tireless = recursosSugeridos(pj).find((r) => r.id === "ranger:tireless");
    expect(tireless?.max).toBe(3);
  });

  it("guerrero psiónico tiene dados de energía = 2 × PB", () => {
    const pj = crearPersonajeVacio({
      name: "P",
      playerName: "",
      classId: "fighter",
      level: 5,
    });
    pj.identity.classes = [{ classId: "fighter", subclassId: "psi-warrior", level: 5 }];
    pj.identity.subclassId = "psi-warrior";
    const dice = recursosSugeridos(pj).find((r) => r.id === "fighter:energy-dice");
    expect(dice?.max).toBe(6);
  });

  it("luz recarga Destello protector en corto desde nivel 6", () => {
    const pj = crearPersonajeVacio({
      name: "L",
      playerName: "",
      classId: "cleric",
      level: 6,
    });
    pj.identity.classes = [{ classId: "cleric", subclassId: "light", level: 6 }];
    pj.identity.subclassId = "light";
    pj.abilities.wis = 16;
    const flare = recursosSugeridos(pj).find((r) => r.id === "cleric:warding-flare");
    expect(flare?.max).toBe(3);
    expect(flare?.recharge).toBe("short");
  });

  it("dote Mata-magos rastrea Mente protegida", () => {
    const pj = crearPersonajeVacio({
      name: "M",
      playerName: "",
      classId: "fighter",
      level: 4,
    });
    pj.feats = [{ id: "mage-slayer", name: "Mata-magos" }];
    const r = recursosSugeridos(pj).find((x) => x.id.includes("guarded-mind"));
    expect(r?.max).toBe(1);
    expect(r?.recharge).toBe("short");
  });
});
