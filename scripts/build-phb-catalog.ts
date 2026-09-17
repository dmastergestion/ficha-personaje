/**
 * Fusiona el catálogo PHB 2024 (pack XPHB) en los JSON embebidos de src/data/srd.
 * No copia descripciones largas de conjuros: esas viven en i18n ES.
 * Requiere vendor/content-pack/xphb-pack.json o public/content-pack/xphb-pack.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { idSrdConjuro } from "../src/rules/spell-aliases.ts";
import { contentPackPaths, idSubclaseCanonico } from "./i18n-shared.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srdDir = path.join(root, "src", "data", "srd");

const SCHOOL_MAP: Record<string, string> = {
  A: "abj",
  C: "con",
  D: "div",
  E: "enc",
  V: "evo",
  I: "ill",
  N: "nec",
  T: "trs",
};

const SPECIES_PARENTS = new Set(["dragonborn", "goliath"]);

interface CatalogEntry {
  id: string;
  srdId: string;
  nameEn: string;
}

interface PackFile {
  subclasses?: { id: string; nameEn: string; classId: string; externalId?: string }[];
  backgrounds?: { id: string; nameEn: string; externalId?: string }[];
  species?: { id: string; nameEn: string; externalId?: string }[];
  spells?: {
    id: string;
    nameEn: string;
    level: number;
    school: string;
    externalId?: string;
    concentration?: boolean;
    ritual?: boolean;
    castType?: "attack" | "save" | "none";
    save?: string;
    damage?: unknown;
    castingTime?: string;
    range?: string;
    components?: string;
    duration?: string;
    areaTags?: string[];
  }[];
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(name: string, data: unknown) {
  fs.writeFileSync(path.join(srdDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function findPack(): PackFile {
  for (const packPath of contentPackPaths()) {
    if (fs.existsSync(packPath)) return loadJson<PackFile>(packPath);
  }
  console.error(
    "No se encontró xphb-pack.json. Ejecuta: npm run fetch:5etools && npm run build:content-pack",
  );
  process.exit(1);
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  for (const item of extra) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

function escuelaCanon(school: string): string {
  const code = school.trim();
  if (SCHOOL_MAP[code]) return SCHOOL_MAP[code];
  return code.toLowerCase();
}

function main() {
  const pack = findPack();

  const subclasses = mergeById(
    loadJson<(CatalogEntry & { classId: string })[]>(path.join(srdDir, "subclasses.json")),
    (pack.subclasses ?? []).map((sc) => {
      const id = idSubclaseCanonico(sc.id);
      return {
        id,
        srdId: sc.externalId ?? id,
        nameEn: sc.nameEn,
        classId: sc.classId,
      };
    }),
  );

  const backgrounds = mergeById(
    loadJson<CatalogEntry[]>(path.join(srdDir, "backgrounds.json")),
    (pack.backgrounds ?? []).map((b) => ({
      id: b.id,
      srdId: b.externalId ?? b.id,
      nameEn: b.nameEn,
    })),
  );

  const packSpecies = (pack.species ?? []).map((s) => ({
    id: s.id,
    srdId: s.externalId ?? s.id,
    nameEn: s.nameEn,
  }));
  const hasVariants = new Set(
    packSpecies
      .map((s) => s.id.split("-")[0] ?? "")
      .filter((parent) => SPECIES_PARENTS.has(parent)),
  );
  const baseSpecies = loadJson<CatalogEntry[]>(path.join(srdDir, "species.json")).filter(
    (s) => !hasVariants.has(s.id),
  );
  const species = mergeById(baseSpecies, packSpecies);

  const spells = mergeById(
    loadJson<Record<string, unknown>[]>(path.join(srdDir, "spells.json")),
    (pack.spells ?? []).map((s) => {
      const id = idSrdConjuro(s.id) ?? s.id;
      const row: Record<string, unknown> = {
        id,
        srdId: s.externalId ?? id,
        nameEn: s.nameEn,
        level: s.level,
        school: escuelaCanon(s.school),
        concentration: s.concentration === true,
        ritual: s.ritual === true,
      };
      if (s.castType) row.castType = s.castType;
      if (s.save) row.save = s.save;
      if (s.damage) row.damage = s.damage;
      if (s.castingTime) row.castingTime = s.castingTime;
      if (s.range) row.range = s.range;
      if (s.components) row.components = s.components;
      if (s.duration) row.duration = s.duration;
      if (s.areaTags?.length) row.areaTags = s.areaTags;
      return row;
    }),
  ).filter((spell, _, all) => {
    const srdId = idSrdConjuro(String(spell.id));
    return !srdId || !all.some((other) => other.id === srdId);
  });

  writeJson("subclasses.json", subclasses);
  writeJson("backgrounds.json", backgrounds);
  writeJson("species.json", species);
  writeJson("spells.json", spells);

  const manifestPath = path.join(srdDir, "manifest.json");
  const manifest = loadJson<{
    source?: string;
    counts: Record<string, number>;
    generatedAt?: string;
  }>(manifestPath);
  manifest.source = "PHB 2024 (XPHB) + SRD 5.2.1";
  manifest.generatedAt = new Date().toISOString();
  manifest.counts = {
    ...manifest.counts,
    subclasses: subclasses.length,
    backgrounds: backgrounds.length,
    species: species.length,
    spells: spells.length,
  };
  writeJson("manifest.json", manifest);

  console.log(
    JSON.stringify(
      {
        subclasses: subclasses.length,
        backgrounds: backgrounds.length,
        species: species.length,
        spells: spells.length,
      },
      null,
      2,
    ),
  );
}

main();
