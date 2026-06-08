import type { AbilityKey, SkillKey } from "@/lib/constants";

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

export function proficienciasIniciales(
  classId: string,
  backgroundId: string | null,
): { savingThrows: AbilityKey[]; skills: SkillKey[] } {
  const savingThrows = [...(SALVACIONES_CLASE[classId] ?? [])];
  const skills = backgroundId ? [...(PERICIAS_TRASFONDO[backgroundId] ?? [])] : [];
  return { savingThrows, skills };
}
