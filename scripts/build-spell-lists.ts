/**
 * Genera src/data/srd/spell-lists.json desde 5etools gendata-spell-source-lookup (XPHB).
 * Requiere: vendor/5etools-src/data/generated/gendata-spell-source-lookup.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const lookupPath = path.join(
  root,
  "vendor",
  "5etools-src",
  "data",
  "generated",
  "gendata-spell-source-lookup.json",
);
const outPath = path.join(root, "src", "data", "srd", "spell-lists.json");

const CLASS_NAME_TO_ID: Record<string, string> = {
  Artificer: "artificer",
  Bard: "bard",
  Cleric: "cleric",
  Druid: "druid",
  Fighter: "fighter",
  Paladin: "paladin",
  Ranger: "ranger",
  Rogue: "rogue",
  Sorcerer: "sorcerer",
  Warlock: "warlock",
  Wizard: "wizard",
};

/** Nombre de subclase 5etools → id en nuestro catálogo SRD. */
const SUBCLASS_NAME_TO_ID: Record<string, string> = {
  "College of Lore": "lore",
  "Circle of the Land": "land",
  "Life Domain": "life",
  "Light Domain": "light",
  "Evoker": "evoker",
  "Fiend Patron": "fiend",
  "The Fiend": "fiend",
  "Eldritch Knight": "eldritch-knight",
  "Arcane Trickster": "arcane-trickster",
  Champion: "champion",
  Hunter: "hunter",
  Thief: "thief",
  "Oath of Devotion": "devotion",
  "Draconic Sorcery": "draconic",
  "Path of the Berserker": "berserker",
  "Warrior of the Open Hand": "hand",
};

type LookupEntry = {
  class?: Record<string, Record<string, boolean>>;
  subclass?: Record<string, Record<string, Record<string, Record<string, { name?: string }>>>>;
};

type SpellListEntry = {
  classes: string[];
  subclasses: { classId: string; subclassId: string }[];
};

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractClasses(entry: LookupEntry): string[] {
  const ids = new Set<string>();
  for (const book of Object.values(entry.class ?? {})) {
    for (const [className, enabled] of Object.entries(book)) {
      if (!enabled) continue;
      const id = CLASS_NAME_TO_ID[className];
      if (id) ids.add(id);
    }
  }
  return [...ids].sort();
}

function extractSubclasses(entry: LookupEntry): { classId: string; subclassId: string }[] {
  const out: { classId: string; subclassId: string }[] = [];
  const seen = new Set<string>();

  for (const sourceBook of Object.values(entry.subclass ?? {})) {
    for (const [className, subclassesBySource] of Object.entries(sourceBook)) {
      const classId = CLASS_NAME_TO_ID[className];
      if (!classId) continue;
      for (const subs of Object.values(subclassesBySource)) {
        for (const sub of Object.values(subs)) {
          const name = sub?.name;
          if (!name) continue;
          const subclassId = SUBCLASS_NAME_TO_ID[name];
          if (!subclassId) continue;
          const key = `${classId}:${subclassId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ classId, subclassId });
        }
      }
    }
  }

  return out.sort((a, b) =>
    a.classId.localeCompare(b.classId) || a.subclassId.localeCompare(b.subclassId),
  );
}

function main() {
  if (!fs.existsSync(lookupPath)) {
    console.error("Falta gendata-spell-source-lookup.json. Ejecuta: npm run fetch:5etools");
    process.exit(1);
  }

  const spells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as {
    id: string;
    nameEn: string;
  }[];
  const lookupFile = JSON.parse(fs.readFileSync(lookupPath, "utf8")) as {
    xphb: Record<string, LookupEntry>;
  };
  const xphb = lookupFile.xphb;

  const byNorm = new Map<string, string>();
  for (const key of Object.keys(xphb)) {
    byNorm.set(normName(key), key);
  }

  const result: Record<string, SpellListEntry> = {};
  let matched = 0;

  for (const spell of spells) {
    const key = byNorm.get(normName(spell.nameEn));
    if (!key) continue;
    const entry = xphb[key];
    if (!entry) continue;

    const classes = extractClasses(entry);
    const subclasses = extractSubclasses(entry);
    if (classes.length === 0 && subclasses.length === 0) continue;

    result[spell.id] = { classes, subclasses };
    matched++;
  }

  fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`spell-lists.json: ${matched}/${spells.length} conjuros SRD con listas de clase`);
}

main();
