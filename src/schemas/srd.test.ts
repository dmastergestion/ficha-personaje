import { describe, expect, it } from "vitest";
import manifest from "@/data/srd/manifest.json";
import classes from "@/data/srd/classes.json";
import spells from "@/data/srd/spells.json";

describe("SRD embebido", () => {
  it("manifest coincide con los JSON generados", () => {
    expect(classes).toHaveLength(manifest.counts.classes);
    expect(spells.length).toBeGreaterThanOrEqual(manifest.counts.spells);
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
