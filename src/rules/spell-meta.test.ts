import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/rules/catalog";
import {
  conjuroEsRitual,
  conjuroRequiereConcentracion,
  mergeConjurosCatalogo,
} from "@/rules/spell-meta";
import { srdSpells } from "@/rules/srd";

describe("mergeConjurosCatalogo", () => {
  it("conserva concentración del SRD si el pack no la trae", () => {
    const merged = mergeConjurosCatalogo(srdSpells, [
      {
        id: "levitate",
        srdId: "levitate",
        nameEn: "Levitate",
        level: 2,
        school: "trs",
        concentration: false,
      },
    ]);

    const levitate = merged.find((s) => s.id === "levitate");
    expect(levitate?.concentration).toBe(true);
    expect(conjuroRequiereConcentracion("levitate", levitate)).toBe(true);
  });
});

describe("buildCatalog.requiereConcentracion", () => {
  it("detecta Levitar con pack PHB sin flag de concentración", () => {
    const catalog = buildCatalog({
      version: 1,
      source: "XPHB",
      from: "test",
      generatedAt: new Date().toISOString(),
      counts: {
        spells: 1,
        classes: 0,
        subclasses: 0,
        species: 0,
        backgrounds: 0,
        weapons: 0,
        armor: 0,
      },
      spells: [
        {
          id: "levitate",
          nameEn: "Levitate",
          level: 2,
          school: "trs",
        },
      ],
      classes: [],
      subclasses: [],
      species: [],
      backgrounds: [],
      weapons: [],
      armor: [],
      i18nEs: {
        spells: {},
        classes: {},
        subclasses: {},
        species: {},
        backgrounds: {},
        weapons: {},
        armor: {},
      },
    });

    expect(catalog.requiereConcentracion("levitate")).toBe(true);
  });
});

describe("conjuroEsRitual", () => {
  it("detecta Alarma como ritual en el SRD", () => {
    const alarm = srdSpells.find((s) => s.id === "alarm");
    expect(alarm?.ritual).toBe(true);
    expect(conjuroEsRitual("alarm", alarm)).toBe(true);
  });

  it("conserva ritual del SRD si el pack no lo trae", () => {
    const merged = mergeConjurosCatalogo(srdSpells, [
      {
        id: "alarm",
        srdId: "alarm",
        nameEn: "Alarm",
        level: 1,
        school: "abj",
        ritual: false,
      },
    ]);

    const alarm = merged.find((s) => s.id === "alarm");
    expect(alarm?.ritual).toBe(true);
    expect(conjuroEsRitual("alarm", alarm)).toBe(true);
  });
});

describe("buildCatalog.esRitual", () => {
  it("detecta Alarma con pack PHB sin flag ritual", () => {
    const catalog = buildCatalog({
      version: 1,
      source: "XPHB",
      from: "test",
      generatedAt: new Date().toISOString(),
      counts: {
        spells: 1,
        classes: 0,
        subclasses: 0,
        species: 0,
        backgrounds: 0,
        weapons: 0,
        armor: 0,
      },
      spells: [
        {
          id: "alarm",
          nameEn: "Alarm",
          level: 1,
          school: "abj",
        },
      ],
      classes: [],
      subclasses: [],
      species: [],
      backgrounds: [],
      weapons: [],
      armor: [],
      i18nEs: {
        spells: {},
        classes: {},
        subclasses: {},
        species: {},
        backgrounds: {},
        weapons: {},
        armor: {},
      },
    });

    expect(catalog.esRitual("alarm")).toBe(true);
  });
});
