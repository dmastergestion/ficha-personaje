/** Utilidades compartidas para generar i18n PHB/SRD en español. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFoundryAPlano } from "../src/lib/foundry-text-clean.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Id SRD → nombre inglés en 5etools cuando el id del pack difiere. */
export const SPELL_SRD_ALIASES: Record<string, string> = {
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

export function projectRoot(): string {
  return root;
}

export function toId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function translateCompendiumDir(): string | null {
  for (const dir of ["translate-dnd5e-sdr2-es", "translate-dnd5e-sdr2-es-tmp"]) {
    const comp = path.join(root, "vendor", dir, "compendium");
    if (fs.existsSync(comp)) return comp;
  }
  return null;
}

export type TranslateFile = {
  folders?: Record<string, string>;
  entries?: Record<string, { name?: string; description?: string }>;
};

export function loadTranslate(name: string): TranslateFile {
  const compDir = translateCompendiumDir();
  if (!compDir) return {};
  const filePath = path.join(compDir, name);
  if (!fs.existsSync(filePath)) return {};
  return loadJson<TranslateFile>(filePath);
}

/** pack id / nameEn → id SRD cuando el conjuro es el mismo con otro slug. */
export function resolvePackSpellToSrdId(
  packId: string,
  nameEn: string,
  srdSpellIds?: Set<string>,
): string | null {
  for (const [srdId, enName] of Object.entries(SPELL_SRD_ALIASES)) {
    if (toId(enName) === packId || toId(enName) === toId(nameEn)) return srdId;
  }
  if (srdSpellIds && srdSpellIds.has(packId)) return packId;
  return null;
}

const FOUNDRY_TERM_FIX_ES: [RegExp, string][] = [
  [/\bReckless Attack\b/g, "Ataque temerario"],
  [/\bUnarmed Strike\b/g, "Golpe sin armas"],
  [/\bBonus Action\b/g, "acción adicional"],
  [/\bMagic Action\b/g, "acción mágica"],
  [/\bReaction\b/g, "Reacción"],
];

export function sanitizarTerminosFoundryEs(text: string): string {
  let out = text;
  for (const [pattern, replacement] of FOUNDRY_TERM_FIX_ES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function foundryDescription(entry?: { description?: string }): string | undefined {
  if (!entry?.description) return undefined;
  const text = sanitizarTerminosFoundryEs(htmlFoundryAPlano(entry.description));
  return text || undefined;
}

/** Índice nombre ES (exacto) → entrada Foundry. */
export function indexFoundryBySpanishName(
  entries: Record<string, { name?: string; description?: string }> | undefined,
): Map<string, { name?: string; description?: string }> {
  const map = new Map<string, { name?: string; description?: string }>();
  for (const entry of Object.values(entries ?? {})) {
    if (entry.name) map.set(entry.name.toLowerCase(), entry);
  }
  return map;
}

/** Índice srdId Foundry → entrada. */
export function indexFoundryByKey(
  entries: Record<string, { name?: string; description?: string }> | undefined,
): Map<string, { name?: string; description?: string }> {
  return new Map(Object.entries(entries ?? {}));
}

export function mergeManual<T extends Record<string, string>>(
  base: T,
  manualPath: string,
): T {
  if (!fs.existsSync(manualPath)) return base;
  const manual = loadJson<Record<string, string>>(manualPath);
  return { ...base, ...manual };
}
