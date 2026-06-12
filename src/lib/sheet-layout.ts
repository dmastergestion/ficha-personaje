import type { AbilityKey, SkillKey } from "@/lib/constants";
import { SKILL_KEYS } from "@/lib/constants";
import { ABILITY_PDF, SKILL_PDF } from "@/pdf/official-field-map";

/** Columnas de atributos como en la ficha oficial 2024 (izq / der). */
export const ABILITY_SHEET_COLUMNS: readonly (readonly AbilityKey[])[] = [
  ["str", "dex", "con"],
  ["int", "wis", "cha"],
];

/** Pericias bajo cada atributo, mismo orden que el PDF editable. */
export const SKILLS_BY_ABILITY: Record<AbilityKey, readonly SkillKey[]> = {
  str: ["athletics"],
  dex: ["acrobatics", "sleightOfHand", "stealth"],
  con: [],
  int: ["arcana", "history", "investigation", "nature", "religion"],
  wis: ["animalHandling", "insight", "medicine", "perception", "survival"],
  cha: ["deception", "intimidation", "performance", "persuasion"],
};

/** @deprecated Usar ABILITY_SHEET_COLUMNS */
export const SKILL_ABILITY_COLUMNS = ABILITY_SHEET_COLUMNS.filter((col) =>
  col.some((ability) => SKILLS_BY_ABILITY[ability].length > 0),
);

/** Etiqueta de atributo (ficha oficial). */
export function etiquetaAtributoOficial(key: AbilityKey): string {
  return ABILITY_PDF[key].score;
}

/** Etiqueta de pericia (ficha oficial). */
export function etiquetaPericiaOficial(skill: SkillKey): string {
  return SKILL_PDF[skill].btn;
}

/** Campos de identidad en orden del PDF. */
export const IDENTITY_FIELDS_PDF = [
  "name",
  "class",
  "subclass",
  "level",
  "species",
  "background",
] as const;

/** Bloque central de combate del PDF (orden de lectura). */
export const COMBAT_STATS_PDF = [
  "proficiency",
  "hp",
  "ac",
  "initiative",
  "speed",
  "passivePerception",
  "hitDice",
  "inspiration",
] as const;

/** Cabecera de fila de ataque en la ficha oficial. */
export const ATTACK_TABLE_HEADERS = [
  "Nombre",
  "Bonificador",
  "Daño y tipo",
  "Notas",
] as const;

/** Cabecera de fila de conjuro en la ficha oficial. */
export const SPELL_TABLE_HEADERS = [
  "Nombre",
  "Nivel",
  "Tiempo",
  "Conc.",
  "Ritual",
  "Material",
  "Alcance",
  "Notas",
] as const;

/** Etiquetas de competencia en armadura (PDF). */
export const ARMOR_PROF_LABELS: Record<string, string> = {
  light: "Ligera",
  medium: "Media",
  heavy: "Pesada",
  shield: "Escudos",
};

/** Itera pericias en el mismo orden que buildOfficialPdfValues. */
export function periciasOrdenPdf(): SkillKey[] {
  return [...SKILL_KEYS];
}

/** Itera atributos en orden de columnas PDF. */
export function atributosOrdenPdf(): AbilityKey[] {
  return ABILITY_SHEET_COLUMNS.flat();
}

export { ABILITY_PDF, SKILL_PDF };
