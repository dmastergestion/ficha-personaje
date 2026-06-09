import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/rules/catalog";
import { conjuroRequiereConcentracion, mergeConjurosCatalogo } from "@/rules/spell-meta";
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
