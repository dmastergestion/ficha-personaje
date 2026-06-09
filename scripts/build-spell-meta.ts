/**
 * Genera src/data/srd/spell-meta.json desde 5etools (XPHB) + spells.json SRD.
 * Requiere: vendor/5etools-src/data/spells/spells-xphb.json
 * Ejecutar: npm run build:spell-meta  (o tras npm run fetch:5etools)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AbilityKey } from "../src/lib/constants";
import { extractSpellDetails, type FiveSpellLike } from "./five-etools-utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const outPath = path.join(root, "src", "data", "srd", "spell-meta.json");
const xphbPath = path.join(root, "vendor", "5etools-src", "data", "spells", "spells-xphb.json");

interface SrdSpellRow {
  id: string;
  nameEn: string;
  level: number;
}

interface FiveSpell extends FiveSpellLike {}

export interface SpellMetaRow {
  castType: "attack" | "save" | "none";
  save?: AbilityKey;
  damage?: {
    dice: string;
    type?: string;
    scalePerSlot?: string;
    cantripScaling?: boolean;
  };
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  ritual?: boolean;
  description?: string;
  areaTags?: string[];
}

const SAVE_ABILITY: Record<string, AbilityKey> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
};

const DAMAGE_TYPE_ES: Record<string, string> = {
  acid: "ácido",
  bludgeoning: "contundente",
  cold: "frío",
  fire: "fuego",
  force: "fuerza",
  lightning: "relámpago",
  necrotic: "necrótico",
  piercing: "perforante",
  poison: "veneno",
  psychic: "psíquico",
  radiant: "radiante",
  slashing: "cortante",
  thunder: "trueno",
};

/** SRD 2024 id → nombre en 5etools XPHB cuando difieren. */
const ID_ALIASES: Record<string, string> = {
  "hideous-laughter": "tasha's hideous laughter",
  "acid-arrow": "melf's acid arrow",
  "arcanists-magic-aura": "nystul's magic aura",
  "arcane-hand": "bigby's hand",
  "tiny-hut": "leomund's tiny hut",
  "black-tentacles": "evard's black tentacles",
  "faithful-hound": "mordenkainen's faithful hound",
  "private-sanctum": "mordenkainen's private sanctum",
  "resilient-sphere": "otiluke's resilient sphere",
  "secret-chest": "leomund's secret chest",
  "telekinetic-hand": "mage hand",
  "unseen-servant": "unseen servant",
  "magic-mouth": "arcane mouth",
  "secret-door": "passwall",
  "globe-of-invulnerability": "globe of invulnerability",
  "instant-summons": "drawmij's instant summons",
  "telepathic-bond": "rary's telepathic bond",
  "freezing-sphere": "otiluke's freezing sphere",
  "irresistible-dance": "otto's irresistible dance",
  "arcane-sword": "mordenkainen's sword",
  "magnificent-mansion": "mordenkainen's magnificent mansion",
};

function toId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function flattenEntries(entries: unknown): string {
  if (!entries) return "";
  if (typeof entries === "string") return entries;
  if (Array.isArray(entries)) return entries.map(flattenEntries).join(" ");
  if (typeof entries === "object" && entries !== null) {
    const obj = entries as Record<string, unknown>;
    return [obj.entries, obj.entry].map(flattenEntries).join(" ");
  }
  return "";
}

function parseDiceToken(token: string): string | null {
  const clean = token.trim().replace(/\s+/g, "");
  const m = /^(\d+)d(\d+)$/i.exec(clean);
  return m ? `${m[1]}d${m[2]}` : null;
}

function extractDiceFromText(text: string): string | null {
  const damageTags = [...text.matchAll(/\{@damage\s+([^}|]+)/gi)];
  for (const m of damageTags) {
    const d = parseDiceToken(m[1] ?? "");
    if (d) return d;
  }
  const diceTags = [...text.matchAll(/\{@dice\s+([^}|]+)/gi)];
  for (const m of diceTags) {
    const d = parseDiceToken(m[1] ?? "");
    if (d) return d;
  }
  return null;
}

function extractScalePerSlot(text: string): string | null {
  const scaledamage = /\{@scaledamage\s+[^|]+\|[^|]+\|([^}]+)\}/i.exec(text);
  if (scaledamage) {
    const d = parseDiceToken(scaledamage[1] ?? "");
    if (d) return d;
  }
  const scaledice = /\{@scaledice\s+[^|]+\|[^|]+\|([^}]+)\}/i.exec(text);
  if (scaledice) {
    const d = parseDiceToken(scaledice[1] ?? "");
    if (d) return d;
  }
  return null;
}

function damageType(entry: FiveSpell): string | undefined {
  const inflict = entry.damageInflict?.[0];
  if (!inflict) {
    const text = flattenEntries(entry.entries).toLowerCase();
    if (text.includes("hit point") || text.includes("regains")) return "curación";
    return undefined;
  }
  return DAMAGE_TYPE_ES[inflict.toLowerCase()] ?? inflict;
}

function castInfo(entry: FiveSpell): Pick<SpellMetaRow, "castType" | "save"> {
  if (entry.spellAttack && entry.spellAttack.length > 0) {
    return { castType: "attack" };
  }
  const save = entry.savingThrow?.[0];
  if (save && SAVE_ABILITY[save]) {
    return { castType: "save", save: SAVE_ABILITY[save] };
  }
  return { castType: "none" };
}

function extractDamage(entry: FiveSpell, spellLevel: number): SpellMetaRow["damage"] | undefined {
  const higher = flattenEntries(entry.entriesHigherLevel);
  const main = flattenEntries(entry.entries);
  const allText = `${main} ${higher}`;
  const hasDamageInflict = (entry.damageInflict?.length ?? 0) > 0;

  if (entry.scalingLevelDice?.scaling?.["1"]) {
    const dice = parseDiceToken(entry.scalingLevelDice.scaling["1"]);
    if (dice) {
      return {
        dice,
        type: damageType(entry),
        cantripScaling: spellLevel === 0,
      };
    }
  }

  // Curación: PV recuperados
  if (/regains?|hit point maximum/i.test(main) && /\{@dice|\{@damage/i.test(main + higher)) {
    const dice = extractDiceFromText(main) ?? extractDiceFromText(higher);
    if (dice) {
      const scalePerSlot = extractScalePerSlot(higher) ?? extractScalePerSlot(main);
      const meta: NonNullable<SpellMetaRow["damage"]> = { dice, type: "curación" };
      if (scalePerSlot && spellLevel > 0) meta.scalePerSlot = scalePerSlot;
      return meta;
    }
  }

  // Daño real: tipo de daño declarado o texto explícito de daño
  const mentionsDamage =
    hasDamageInflict ||
    /taking\s+\{@damage|takes\s+\{@damage|take\s+\{@damage|deals\s+\{@damage|on a hit,\s+the target takes/i.test(
      allText,
    );

  if (!mentionsDamage) return undefined;

  const dice = extractDiceFromText(main) ?? extractDiceFromText(higher);
  if (!dice) return undefined;

  const scalePerSlot = extractScalePerSlot(higher) ?? extractScalePerSlot(main);
  const meta: NonNullable<SpellMetaRow["damage"]> = { dice, type: damageType(entry) };
  if (scalePerSlot && spellLevel > 0) meta.scalePerSlot = scalePerSlot;
  return meta;
}

function buildMeta(entry: FiveSpell, spellLevel: number): SpellMetaRow {
  const row: SpellMetaRow = { ...castInfo(entry), ...extractSpellDetails(entry) };
  const dmg = extractDamage(entry, spellLevel);
  if (dmg) row.damage = dmg;
  return row;
}

/** Extrae metadatos de tirada/daño desde una entrada 5etools. */
export function extractSpellMeta(entry: FiveSpell, spellLevel: number): SpellMetaRow {
  return buildMeta(entry, spellLevel);
}

function loadFiveSpells(): FiveSpell[] {
  if (!fs.existsSync(xphbPath)) {
    console.error(`No se encontró ${xphbPath}. Ejecuta: npm run fetch:5etools`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(xphbPath, "utf8")) as { spell?: FiveSpell[] };
  return data.spell ?? [];
}

function main() {
  const srdSpells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as SrdSpellRow[];
  const fiveSpells = loadFiveSpells();

  const byId = new Map(fiveSpells.map((s) => [toId(s.name ?? ""), s]));
  const byName = new Map(fiveSpells.map((s) => [(s.name ?? "").toLowerCase(), s]));

  const meta: Record<string, SpellMetaRow> = {};
  let matched = 0;
  const unmatched: string[] = [];

  for (const spell of srdSpells) {
    let entry =
      byId.get(spell.id) ??
      (ID_ALIASES[spell.id] ? byName.get(ID_ALIASES[spell.id]!) : undefined) ??
      byName.get(spell.nameEn.toLowerCase());

    if (!entry) {
      unmatched.push(spell.id);
      meta[spell.id] = { castType: "none" };
      continue;
    }

    matched++;
    meta[spell.id] = buildMeta(entry, spell.level);
  }

  fs.writeFileSync(outPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  const withDamage = Object.values(meta).filter((m) => m.damage).length;
  const attacks = Object.values(meta).filter((m) => m.castType === "attack").length;
  const saves = Object.values(meta).filter((m) => m.castType === "save").length;

  console.log(
    JSON.stringify(
      {
        total: srdSpells.length,
        matched,
        unmatched: unmatched.length,
        withDamage,
        attacks,
        saves,
        out: path.relative(root, outPath),
      },
      null,
      2,
    ),
  );

  if (unmatched.length > 0) {
    console.warn("Sin match 5etools:", unmatched.join(", "));
  }
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) main();
