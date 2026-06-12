import type { AbilityKey, SkillKey } from "@/lib/constants";
import { etiquetaHerramienta } from "@/lib/origin-text";
import classProfMeta from "@/data/srd/class-prof-meta.json";
import type { Character } from "@/schemas/character";
import { obtenerArma } from "@/rules/srd";

/** Salvaciones proficientes por clase — SRD 2024 (12 clases). */
export const SALVACIONES_CLASE: Record<string, AbilityKey[]> = {
  barbarian: ["str", "con"],
  bard: ["dex", "cha"],
  cleric: ["wis", "cha"],
  druid: ["int", "wis"],
  fighter: ["str", "con"],
  monk: ["str", "dex"],
  paladin: ["wis", "cha"],
  ranger: ["str", "dex"],
  rogue: ["dex", "int"],
  sorcerer: ["con", "cha"],
  warlock: ["wis", "cha"],
  wizard: ["int", "wis"],
};

type ClassProfMeta = Record<
  string,
  { armor: string[]; weapons: string[]; tools: string[] }
>;

const profMeta = classProfMeta as ClassProfMeta;

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function competenciasClase(classId: string): {
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
} {
  const row = profMeta[classId];
  return {
    armorProficiencies: row?.armor ?? [],
    weaponProficiencies: row?.weapons ?? [],
    toolProficiencies: row?.tools ?? [],
  };
}

export function proficienciasIniciales(
  classId: string,
  originSkills: SkillKey[] = [],
  originTools: string[] = [],
): {
  savingThrows: AbilityKey[];
  skills: SkillKey[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
} {
  const savingThrows = [...(SALVACIONES_CLASE[classId] ?? [])];
  const classProf = competenciasClase(classId);
  return {
    savingThrows,
    skills: [...originSkills],
    armorProficiencies: [...classProf.armorProficiencies],
    weaponProficiencies: [...classProf.weaponProficiencies],
    toolProficiencies: uniq([...classProf.toolProficiencies, ...originTools]),
  };
}

export function esCompetenteConArma(character: Character, weaponId: string | null): boolean {
  if (!weaponId) return true;
  const weapon = obtenerArma(weaponId);
  if (!weapon) return true;

  const profs = character.proficiencies.weaponProficiencies.map((p) => p.toLowerCase());
  if (profs.length === 0) return true;

  const category = weapon.category.toLowerCase();
  if (profs.some((p) => p.includes("martial") && category === "martial")) return true;
  if (profs.some((p) => p.includes("simple") && category === "simple")) return true;
  if (profs.some((p) => p === category)) return true;
  return profs.some((p) => p.includes("martial") || p.includes("simple"));
}

const ARMOR_PROF_LABELS_ES: Record<string, string> = {
  light: "Ligera",
  medium: "Media",
  heavy: "Pesada",
  shield: "Escudos",
};

const WEAPON_PROF_TOKEN_ES: Record<string, string> = {
  simple: "Simples",
  martial: "Marciales",
  light: "ligeras",
  finesse: "sutiles",
};

/** Etiqueta legible de competencia en armadura (p. ej. light → Ligera). */
export function etiquetaCompetenciaArmadura(raw: string): string {
  return ARMOR_PROF_LABELS_ES[raw.trim().toLowerCase()] ?? raw;
}

/** Etiqueta legible de competencia en armas (p. ej. simple, martial (light)). */
export function etiquetaCompetenciaArma(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const martialVariant = lower.match(/^martial\s*\((.+)\)$/);
  if (martialVariant) {
    const inner = martialVariant[1]!
      .split(/[/,]/)
      .map((part) => WEAPON_PROF_TOKEN_ES[part.trim()] ?? part.trim())
      .join("/");
    return `Marciales (${inner})`;
  }
  return WEAPON_PROF_TOKEN_ES[lower] ?? trimmed;
}

export function etiquetaListaCompetenciasArmadura(items: readonly string[]): string {
  return items.map(etiquetaCompetenciaArmadura).join(", ");
}

export function etiquetaListaCompetenciasArmas(items: readonly string[]): string {
  return items.map(etiquetaCompetenciaArma).join(", ");
}

export function etiquetaListaCompetenciasHerramientas(items: readonly string[]): string {
  return items.map(etiquetaHerramienta).join(", ");
}
