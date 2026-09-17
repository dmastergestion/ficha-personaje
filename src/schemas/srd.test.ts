import { describe, expect, it } from "vitest";
import manifest from "@/data/srd/manifest.json";
import classes from "@/data/srd/classes.json";
import spells from "@/data/srd/spells.json";
import subclasses from "@/data/srd/subclasses.json";
import backgrounds from "@/data/srd/backgrounds.json";
import species from "@/data/srd/species.json";
import { defaultCatalog } from "@/rules/catalog";
import { subclaseValidaParaClase } from "@/rules/multiclass";
import { buildSpeciesGroups } from "@/rules/species-catalog";

describe("SRD embebido", () => {
  it("manifest coincide con los JSON generados", () => {
    expect(classes).toHaveLength(manifest.counts.classes);
    expect(spells.length).toBeGreaterThanOrEqual(manifest.counts.spells);
    expect(subclasses).toHaveLength(manifest.counts.subclasses);
    expect(backgrounds).toHaveLength(manifest.counts.backgrounds);
    expect(species).toHaveLength(manifest.counts.species);
  });

  it("incluye las 12 clases SRD", () => {
    const ids = classes.map((c: { id: string }) => c.id).sort();
    expect(ids).toEqual(
      [
        "barbarian",
        "bard",
        "cleric",
        "druid",
        "fighter",
        "monk",
        "paladin",
        "ranger",
        "rogue",
        "sorcerer",
        "warlock",
        "wizard",
      ].sort(),
    );
  });
});

describe("catálogo PHB 2024 embebido", () => {
  it("incluye los 16 trasfondos y subclases PHB sin esperar el pack", () => {
    expect(backgrounds.map((b: { id: string }) => b.id)).toEqual(
      expect.arrayContaining(["acolyte", "artisan", "noble", "wayfarer"]),
    );
    expect(backgrounds).toHaveLength(16);
    expect(subclasses).toHaveLength(48);
    expect(subclaseValidaParaClase("barbarian", "wild-heart")).toBe(true);
    expect(subclaseValidaParaClase("fighter", "battle-master")).toBe(true);
    expect(subclaseValidaParaClase("monk", "hand")).toBe(true);
  });

  it("incluye aasimar y linajes de dracónido/goliat", () => {
    const ids = species.map((s: { id: string }) => s.id);
    expect(ids).toContain("aasimar");
    expect(ids).toContain("dragonborn-red");
    expect(ids).toContain("goliath-cloud-giant");
    expect(ids).not.toContain("dragonborn");
    const groups = buildSpeciesGroups(species);
    expect(groups.map((g) => g.id)).toEqual(
      expect.arrayContaining(["aasimar", "dragonborn", "goliath", "human"]),
    );
  });

  it("incluye conjuros solo PHB en el catálogo por defecto", () => {
    expect(spells.some((s: { id: string }) => s.id === "armor-of-agathys")).toBe(true);
    expect(defaultCatalog.obtenerConjuro("armor-of-agathys")?.level).toBe(1);
    expect(defaultCatalog.backgrounds).toHaveLength(16);
    expect(defaultCatalog.subclasses.filter((s) => s.classId === "barbarian")).toHaveLength(4);
  });
});
