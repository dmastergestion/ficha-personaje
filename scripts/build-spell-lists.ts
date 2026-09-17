/**
 * Genera src/data/srd/spell-lists.json desde 5etools gendata-spell-source-lookup (XPHB).
 * Requiere: vendor/5etools-src/data/generated/gendata-spell-source-lookup.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPELL_SRD_ALIASES, contentPackPaths, idSubclaseCanonico, toId } from "./i18n-shared.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const packPaths = contentPackPaths();
const classDir = path.join(root, "vendor", "5etools-src", "data", "class");
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
  Barbarian: "barbarian",
  Bard: "bard",
  Cleric: "cleric",
  Druid: "druid",
  Fighter: "fighter",
  Monk: "monk",
  Paladin: "paladin",
  Ranger: "ranger",
  Rogue: "rogue",
  Sorcerer: "sorcerer",
  Warlock: "warlock",
  Wizard: "wizard",
};

function mapaNombresSubclase(): Record<string, string> {
  const map: Record<string, string> = {
    "The Fiend": "fiend",
    "Fiend Patron": "fiend",
  };
  if (!fs.existsSync(classDir)) return map;
  for (const file of fs.readdirSync(classDir).filter((f) => /^class-[a-z]+\.json$/.test(f))) {
    const data = JSON.parse(fs.readFileSync(path.join(classDir, file), "utf8")) as {
      subclass?: { source?: string; name?: string; shortName?: string }[];
    };
    for (const sc of data.subclass ?? []) {
      if (sc.source !== "XPHB" || !sc.name) continue;
      map[sc.name] = idSubclaseCanonico(toId(sc.shortName ?? sc.name));
    }
  }
  return map;
}

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

function extractSubclasses(
  entry: LookupEntry,
  nameMap: Record<string, string>,
): { classId: string; subclassId: string }[] {
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
          const subclassId = nameMap[name];
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

  const srdSpells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as {
    id: string;
    nameEn: string;
  }[];
  const packFile = packPaths.find((p) => fs.existsSync(p));
  const packSpells = packFile
    ? (
        JSON.parse(fs.readFileSync(packFile, "utf8")) as {
          spells?: { id: string; nameEn: string }[];
        }
      ).spells ?? []
    : [];
  const spellsById = new Map<string, { id: string; nameEn: string }>();
  for (const spell of [...srdSpells, ...packSpells]) {
    if (!spellsById.has(spell.id)) spellsById.set(spell.id, spell);
  }
  const spells = [...spellsById.values()];
  const nameMap = mapaNombresSubclase();
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
    const aliasEn = SPELL_SRD_ALIASES[spell.id];
    const key =
      byNorm.get(normName(spell.nameEn)) ??
      (aliasEn ? byNorm.get(normName(aliasEn)) : undefined);
    if (!key) continue;
    const entry = xphb[key];
    if (!entry) continue;

    const classes = extractClasses(entry);
    const subclasses = extractSubclasses(entry, nameMap);
    if (classes.length === 0 && subclasses.length === 0) continue;

    result[spell.id] = { classes, subclasses };
    matched++;
  }

  fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`spell-lists.json: ${matched}/${spells.length} conjuros (SRD+pack) con listas de clase`);
}

main();
