import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  defaultCatalog,
  resumenPackNuevo,
} from "@/rules/catalog";
import type { ContentPack } from "@/schemas/content-pack";

const I18N_VACIO = {
  spells: {},
  classes: {},
  subclasses: {},
  species: {},
  backgrounds: {},
  weapons: {},
  armor: {},
};

function packDePrueba(over: Partial<ContentPack> = {}): ContentPack {
  return {
    version: 1,
    source: "TEST",
    from: "test",
    generatedAt: new Date().toISOString(),
    counts: {
      spells: 0,
      classes: 0,
      subclasses: 0,
      species: 0,
      backgrounds: 0,
      weapons: 0,
      armor: 0,
    },
    spells: [],
    classes: [],
    subclasses: [],
    species: [],
    backgrounds: [],
    weapons: [],
    armor: [],
    i18nEs: I18N_VACIO,
    ...over,
  };
}

describe("buildCatalog sin duplicar el PHB", () => {
  it("ignora subclases, trasfondos y especies que ya están embebidos", () => {
    const catalog = buildCatalog(
      packDePrueba({
        subclasses: [
          { id: "open-hand", nameEn: "Warrior of the Open Hand", classId: "monk" },
          { id: "wild-heart", nameEn: "Path of the Wild Heart", classId: "barbarian" },
        ],
        backgrounds: [{ id: "noble", nameEn: "Noble" }],
        species: [
          { id: "aasimar", nameEn: "Aasimar" },
          { id: "dragonborn", nameEn: "Dragonborn" },
        ],
      }),
    );

    expect(catalog.subclasses).toHaveLength(defaultCatalog.subclasses.length);
    expect(catalog.backgrounds).toHaveLength(defaultCatalog.backgrounds.length);
    expect(catalog.species).toHaveLength(defaultCatalog.species.length);
    expect(catalog.subclasses.filter((s) => s.id === "hand" || s.id === "open-hand")).toHaveLength(
      1,
    );
    expect(catalog.species.some((s) => s.id === "dragonborn")).toBe(false);
  });

  it("añade contenido que no está en el PHB", () => {
    const catalog = buildCatalog(
      packDePrueba({
        spells: [
          {
            id: "homebrew-bolt",
            nameEn: "Homebrew Bolt",
            level: 1,
            school: "evo",
          },
        ],
        backgrounds: [{ id: "homebrew-guild", nameEn: "Guild of Tests" }],
        subclasses: [{ id: "homebrew-path", nameEn: "Path of Tests", classId: "barbarian" }],
      }),
    );

    expect(catalog.obtenerConjuro("homebrew-bolt")?.level).toBe(1);
    expect(catalog.obtenerTrasfondo("homebrew-guild")).toBeTruthy();
    expect(catalog.subclasses.some((s) => s.id === "homebrew-path")).toBe(true);
    expect(resumenPackNuevo(packDePrueba({
      spells: [{ id: "homebrew-bolt", nameEn: "Homebrew Bolt", level: 1, school: "evo" }],
    }))).toMatchObject({ spells: 1, subclasses: 0, backgrounds: 0 });
  });
});
