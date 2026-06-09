import type { AbilityKey, SkillKey } from "@/lib/constants";
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

/** Dos pericias por trasfondo SRD v1 (asignación fija simplificada). */
export const PERICIAS_TRASFONDO: Record<string, SkillKey[]> = {
  acolyte: ["insight", "religion"],
  criminal: ["sleightOfHand", "stealth"],
  sage: ["arcana", "history"],
  soldier: ["athletics", "intimidation"],
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
  backgroundId: string | null,
  backgroundTools: string[] = [],
): {
  savingThrows: AbilityKey[];
  skills: SkillKey[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
} {
  const savingThrows = [...(SALVACIONES_CLASE[classId] ?? [])];
  const skills = backgroundId ? [...(PERICIAS_TRASFONDO[backgroundId] ?? [])] : [];
  const classProf = competenciasClase(classId);
  return {
    savingThrows,
    skills,
    armorProficiencies: [...classProf.armorProficiencies],
    weaponProficiencies: [...classProf.weaponProficiencies],
    toolProficiencies: uniq([...classProf.toolProficiencies, ...backgroundTools]),
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
