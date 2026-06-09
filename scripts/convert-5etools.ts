import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AbilityKey } from "../src/lib/constants.js";
import { extractSpellMeta } from "./build-spell-meta.js";
import {
  extractBackgroundDetails,
  extractSpeciesDetails,
  extractSpellDetails,
  type FiveSpellLike,
} from "./five-etools-utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "vendor", "5etools-src", "data");
const outDir = path.join(root, "vendor", "content-pack");

const SOURCE = process.env.CONTENT_SOURCE ?? "XPHB";

interface FiveEntry {
  name?: string;
  source?: string;
  level?: number;
  school?: string;
  className?: string;
  classSource?: string;
  shortName?: string;
  hd?: { faces?: number };
  primaryAbility?: Record<string, boolean>[];
  proficiency?: string[];
  type?: string;
  weapon?: boolean;
  armor?: boolean;
  weaponCategory?: string;
  property?: string[];
  dmg1?: string;
  dmgType?: string;
  weight?: number;
  ac?: number;
  strength?: string | number;
  stealth?: boolean;
  duration?: { concentration?: boolean; type?: string }[];
  spellAttack?: string[];
  savingThrow?: string[];
  damageInflict?: string[];
  scalingLevelDice?: { label?: string; scaling?: Record<string, string> };
  entries?: unknown;
  entriesHigherLevel?: unknown;
  time?: FiveSpellLike["time"];
  range?: FiveSpellLike["range"];
  components?: FiveSpellLike["components"];
  areaTags?: string[];
  miscTags?: string[];
  ritual?: boolean;
  size?: string[];
  speed?: number;
  skillProficiencies?: unknown;
  toolProficiencies?: unknown;
  feats?: Record<string, boolean>[];
  dmg2?: string;
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function toId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function externalRef(entry: FiveEntry): string {
  return `${entry.name}|${entry.source}`;
}

const DAMAGE_TYPES: Record<string, string> = {
  S: "slashing",
  P: "piercing",
  B: "bludgeoning",
  A: "acid",
  C: "cold",
  F: "fire",
  L: "lightning",
  N: "necrotic",
  O: "poison",
  R: "radiant",
  T: "thunder",
  Y: "psychic",
  I: "force",
};

const PROPERTY_MAP: Record<string, string> = {
  A: "amm",
  AMM: "amm",
  H: "hvy",
  HVY: "hvy",
  "2H": "two",
  V: "ver",
  F: "fin",
  FIN: "fin",
  L: "lgt",
  LGT: "lgt",
  T: "thr",
  THR: "thr",
  R: "rch",
  RCH: "rch",
  LD: "lod",
  LOD: "lod",
};

function mapProperties(props: string[] | undefined): string[] {
  if (!props?.length) return [];
  const out = new Set<string>();
  for (const raw of props) {
    const text = String(raw);
    const code = text.split("|")[0]?.toUpperCase() ?? text.toUpperCase();
    out.add(PROPERTY_MAP[code] ?? code.toLowerCase());
  }
  return [...out];
}

function weaponCategory(entry: FiveEntry): string {
  const cat = entry.weaponCategory ?? "simple";
  const typeCode = (entry.type ?? "M").split("|")[0]?.toUpperCase() ?? "M";
  const ranged = typeCode === "R";
  return `${cat}${ranged ? "R" : "M"}`;
}

function weaponAbility(entry: FiveEntry): AbilityKey {
  const props = mapProperties(entry.property);
  const typeCode = (entry.type ?? "M").split("|")[0]?.toUpperCase() ?? "M";
  if (typeCode === "R" || props.includes("fin")) return "dex";
  return "str";
}

function armorCategory(type: string | undefined): "light" | "medium" | "heavy" | "shield" | null {
  const code = (type ?? "").split("|")[0]?.toUpperCase();
  if (code === "LA") return "light";
  if (code === "MA") return "medium";
  if (code === "HA") return "heavy";
  if (code === "S") return "shield";
  return null;
}

function primaryAbilities(entry: FiveEntry): AbilityKey[] {
  const keys: AbilityKey[] = [];
  for (const block of entry.primaryAbility ?? []) {
    for (const [key, active] of Object.entries(block)) {
      if (active && ["str", "dex", "con", "int", "wis", "cha"].includes(key)) {
        keys.push(key as AbilityKey);
      }
    }
  }
  if (keys.length) return keys;
  return (entry.proficiency ?? []).filter((k): k is AbilityKey =>
    ["str", "dex", "con", "int", "wis", "cha"].includes(k),
  );
}

function requiresConcentration(entry: FiveEntry): boolean {
  return entry.duration?.some((d) => d.concentration === true) ?? false;
}

function buildSpells() {
  const file = path.join(dataRoot, "spells", `spells-${SOURCE.toLowerCase()}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`No se encontró ${file}`);
    return [];
  }
  const data = loadJson<{ spell?: FiveEntry[] }>(file);
  return (data.spell ?? [])
    .filter((s) => s.source === SOURCE && s.name)
    .map((s) => {
      const meta = extractSpellMeta(s, s.level ?? 0);
      const details = extractSpellDetails(s);
      return {
        id: toId(s.name!),
        externalId: externalRef(s),
        nameEn: s.name!,
        level: s.level ?? 0,
        school: s.school ?? "",
        concentration: requiresConcentration(s),
        castType: meta.castType,
        ...(meta.save ? { save: meta.save } : {}),
        ...(meta.damage ? { damage: meta.damage } : {}),
        ...(details.castingTime ? { castingTime: details.castingTime } : {}),
        ...(details.range ? { range: details.range } : {}),
        ...(details.components ? { components: details.components } : {}),
        ...(details.duration ? { duration: details.duration } : {}),
        ...(details.ritual ? { ritual: true } : {}),
        ...(details.description ? { description: details.description } : {}),
        ...(details.areaTags?.length ? { areaTags: details.areaTags } : {}),
      };
    });
}

function buildClassesAndSubclasses() {
  const classes: Record<string, unknown>[] = [];
  const subclasses: Record<string, unknown>[] = [];
  const classFiles = fg.sync("class/class-*.json", { cwd: dataRoot });

  for (const rel of classFiles) {
    const data = loadJson<{ class?: FiveEntry[]; subclass?: FiveEntry[] }>(
      path.join(dataRoot, rel),
    );

    for (const c of data.class ?? []) {
      if (c.source !== SOURCE || !c.name) continue;
      const id = toId(c.name);
      classes.push({
        id,
        externalId: externalRef(c),
        nameEn: c.name,
        hitDie: `d${c.hd?.faces ?? 8}`,
        primaryAbilities: primaryAbilities(c),
      });
    }

    for (const sc of data.subclass ?? []) {
      if (sc.source !== SOURCE || !sc.name || !sc.className) continue;
      subclasses.push({
        id: toId(sc.shortName ?? sc.name),
        externalId: externalRef(sc),
        nameEn: sc.name,
        classId: toId(sc.className),
      });
    }
  }

  return { classes, subclasses };
}

function filterBySource<T extends FiveEntry>(entries: T[] | undefined): T[] {
  return (entries ?? []).filter((e) => e.source === SOURCE && e.name);
}

function buildOrigins() {
  const races = loadJson<{ race?: FiveRace[] }>(path.join(dataRoot, "races.json"));
  const backgrounds = loadJson<{ background?: FiveEntry[] }>(
    path.join(dataRoot, "backgrounds.json"),
  );

  return {
    species: buildSpecies(races.race ?? []),
    backgrounds: filterBySource(backgrounds.background).map((b) => ({
      id: toId(b.name!),
      externalId: externalRef(b),
      nameEn: b.name!,
      ...extractBackgroundDetails(b),
    })),
  };
}

interface FiveRace extends FiveEntry {
  _versions?: FiveRaceVersion[];
}

interface FiveRaceVersion extends FiveEntry {
  _abstract?: { name?: string; source?: string };
  _implementations?: { _variables?: { color?: string } }[];
}

function speciesIdFromVersion(versionName: string, parentName: string): string {
  const part = versionName.includes("; ")
    ? versionName.split("; ")[1]!
    : versionName;
  const lower = part.toLowerCase();
  const parent = toId(parentName);

  if (lower.includes("drow")) return "elf-drow";
  if (lower.includes("high elf")) return "elf-high";
  if (lower.includes("wood elf")) return "elf-wood";
  if (lower.includes("forest gnome")) return "gnome-forest";
  if (lower.includes("rock gnome")) return "gnome-rock";
  if (lower.includes("abyssal")) return "tiefling-abyssal";
  if (lower.includes("chthonic")) return "tiefling-chthonic";
  if (lower.includes("infernal")) return "tiefling-infernal";
  if (parent === "goliath") {
    return `goliath-${toId(part.replace(/\s+(ancestry|legacy|lineage)$/i, ""))}`;
  }
  return `${parent}-${toId(part.replace(/\s+(ancestry|legacy|lineage)$/i, ""))}`;
}

function speciesLabelFromVersion(versionName: string, parentName: string): string {
  if (!versionName.includes("; ")) return versionName;
  const suffix = versionName.split("; ")[1]!;
  return `${parentName}, ${suffix.replace(/\s+(Lineage|Legacy|Ancestry)$/i, "")}`;
}

function buildSpecies(races: FiveRace[]) {
  const out: {
    id: string;
    externalId: string;
    nameEn: string;
    size?: string;
    speed?: number;
    skillProficiencies?: string[];
    traits?: string;
  }[] = [];

  for (const race of filterBySource(races)) {
    const baseDetails = extractSpeciesDetails(race);
    const versions = race._versions ?? [];
    const xphbVersions = versions.filter(
      (v) =>
        v.source === SOURCE ||
        (v._abstract && v._implementations?.length),
    );

    if (xphbVersions.length === 0) {
      out.push({
        id: toId(race.name!),
        externalId: externalRef(race),
        nameEn: race.name!,
        ...baseDetails,
      });
      continue;
    }

    for (const version of xphbVersions) {
      if (version._abstract && version._implementations) {
        for (const impl of version._implementations) {
          const color = impl._variables?.color;
          if (!color) continue;
          out.push({
            id: `dragonborn-${toId(color)}`,
            externalId: `${race.name} (${color})|${SOURCE}`,
            nameEn: `Dragonborn (${color})`,
            ...extractSpeciesDetails({ ...race, entries: version.entries ?? race.entries }),
          });
        }
        continue;
      }

      if (!version.name) continue;
      out.push({
        id: speciesIdFromVersion(version.name, race.name!),
        externalId: externalRef(version),
        nameEn: speciesLabelFromVersion(version.name, race.name!),
        ...extractSpeciesDetails({
          ...race,
          entries: version.entries ?? race.entries,
        }),
      });
    }
  }

  const seen = new Set<string>();
  return out.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function buildEquipment() {
  const data = loadJson<{ baseitem?: FiveEntry[] }>(path.join(dataRoot, "items-base.json"));
  const weapons: Record<string, unknown>[] = [];
  const armor: Record<string, unknown>[] = [];

  for (const item of filterBySource(data.baseitem)) {
    if (item.weapon) {
      weapons.push({
        id: toId(item.name!),
        externalId: externalRef(item),
        nameEn: item.name!,
        category: weaponCategory(item),
        damageDie: item.dmg1 ?? "1d4",
        damageType: DAMAGE_TYPES[item.dmgType ?? "B"] ?? "bludgeoning",
        abilityKey: weaponAbility(item),
        weightLb: item.weight ?? 0,
        properties: mapProperties(item.property),
        ...(item.dmg2 ? { versatileDamageDie: item.dmg2 } : {}),
        ...(item.range ? { range: String(item.range) } : {}),
      });
      continue;
    }

    if (item.armor) {
      const category = armorCategory(item.type);
      if (!category) continue;
      const strengthMin =
        typeof item.strength === "string"
          ? Number(item.strength) || null
          : (item.strength ?? null);
      armor.push({
        id: toId(item.name!),
        externalId: externalRef(item),
        nameEn: item.name!,
        category,
        baseAc: item.ac ?? (category === "shield" ? 2 : 11),
        dexMax: category === "heavy" ? 0 : category === "medium" ? 2 : null,
        strengthMin,
        stealthDisadvantage: Boolean(item.stealth),
      });
    }
  }

  weapons.sort((a, b) => String(a.nameEn).localeCompare(String(b.nameEn)));
  armor.sort((a, b) => String(a.nameEn).localeCompare(String(b.nameEn)));
  return { weapons, armor };
}

function buildI18nEs(
  spells: { id: string; nameEn: string }[],
  classes: { id: string; nameEn: string }[],
  subclasses: { id: string; nameEn: string }[],
  species: { id: string; nameEn: string }[],
  backgrounds: { id: string; nameEn: string }[],
  weapons: { id: string; nameEn: string }[],
  armor: { id: string; nameEn: string }[],
) {
  const map = (items: { id: string; nameEn: string }[]) =>
    Object.fromEntries(items.map((i) => [i.id, i.nameEn]));
  return {
    spells: map(spells),
    classes: map(classes),
    subclasses: map(subclasses),
    species: map(species),
    backgrounds: map(backgrounds),
    weapons: map(weapons),
    armor: map(armor),
  };
}

function main() {
  if (!fs.existsSync(dataRoot)) {
    console.error(
      "vendor/5etools-src/data no encontrado. Ejecuta: npm run fetch:5etools",
    );
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const spells = buildSpells();
  const { classes, subclasses } = buildClassesAndSubclasses();
  const { species, backgrounds } = buildOrigins();
  const { weapons, armor } = buildEquipment();

  const pack = {
    version: 1,
    source: SOURCE,
    from: "5etools",
    generatedAt: new Date().toISOString(),
    counts: {
      spells: spells.length,
      classes: classes.length,
      subclasses: subclasses.length,
      species: species.length,
      backgrounds: backgrounds.length,
      weapons: weapons.length,
      armor: armor.length,
    },
    spells,
    classes,
    subclasses,
    species,
    backgrounds,
    weapons,
    armor,
    i18nEs: buildI18nEs(
      spells as { id: string; nameEn: string }[],
      classes as { id: string; nameEn: string }[],
      subclasses as { id: string; nameEn: string }[],
      species as { id: string; nameEn: string }[],
      backgrounds as { id: string; nameEn: string }[],
      weapons as { id: string; nameEn: string }[],
      armor as { id: string; nameEn: string }[],
    ),
  };

  const outFile = path.join(outDir, `${SOURCE.toLowerCase()}-pack.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(pack, null, 2)}\n`, "utf8");

  console.log(`Pack generado: ${outFile}`);
  console.log(JSON.stringify(pack.counts, null, 2));
}

main();
