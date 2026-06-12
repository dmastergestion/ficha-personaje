import type { AbilityKey, SkillKey } from "@/lib/constants";
import {
  ABILITY_SHEET_COLUMNS,
  SKILLS_BY_ABILITY,
  etiquetaPericiaOficial,
} from "@/lib/sheet-layout";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { calcularModificadoresCondiciones } from "@/rules/effects";
import { bonificadorIniciativaDotes, periciasExtraDotes } from "@/rules/feat-mechanics";
import type { Character } from "@/schemas/character";

export { ABILITY_SHEET_COLUMNS, SKILLS_BY_ABILITY };
/** @deprecated Usar ABILITY_SHEET_COLUMNS */
export const SKILL_ABILITY_COLUMNS = ABILITY_SHEET_COLUMNS;

export const SKILL_ABILITIES: Record<SkillKey, AbilityKey> = {
  acrobatics: "dex",
  animalHandling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleightOfHand: "dex",
  stealth: "dex",
  survival: "wis",
};

export const SKILL_LABELS_ES: Record<SkillKey, string> = {
  acrobatics: etiquetaPericiaOficial("acrobatics"),
  animalHandling: etiquetaPericiaOficial("animalHandling"),
  arcana: etiquetaPericiaOficial("arcana"),
  athletics: etiquetaPericiaOficial("athletics"),
  deception: etiquetaPericiaOficial("deception"),
  history: etiquetaPericiaOficial("history"),
  insight: etiquetaPericiaOficial("insight"),
  intimidation: etiquetaPericiaOficial("intimidation"),
  investigation: etiquetaPericiaOficial("investigation"),
  medicine: etiquetaPericiaOficial("medicine"),
  nature: etiquetaPericiaOficial("nature"),
  perception: etiquetaPericiaOficial("perception"),
  performance: etiquetaPericiaOficial("performance"),
  persuasion: etiquetaPericiaOficial("persuasion"),
  religion: etiquetaPericiaOficial("religion"),
  sleightOfHand: etiquetaPericiaOficial("sleightOfHand"),
  stealth: etiquetaPericiaOficial("stealth"),
  survival: etiquetaPericiaOficial("survival"),
};

export const ABILITY_LABELS_ES: Record<AbilityKey, string> = {
  str: "Fuerza",
  dex: "Destreza",
  con: "Constitución",
  int: "Inteligencia",
  wis: "Sabiduría",
  cha: "Carisma",
};

function esProficiente(character: Character, skill: SkillKey): boolean {
  if (skill in character.proficiencies.skillOverrides) {
    return character.proficiencies.skillOverrides[skill] ?? false;
  }
  if (periciasExtraDotes(character).includes(skill)) return true;
  return character.proficiencies.skills.includes(skill);
}

export function modificadorPericia(character: Character, skill: SkillKey): number {
  const ability = SKILL_ABILITIES[skill];
  const base = modificadorAtributo(character.abilities[ability]);
  const pb = esProficiente(character, skill)
    ? bonificadorCompetencia(character.identity.level)
    : 0;
  return base + pb;
}

export function modificadorSalvacion(character: Character, ability: AbilityKey): number {
  const base = modificadorAtributo(character.abilities[ability]);
  const pb = character.proficiencies.savingThrows.includes(ability)
    ? bonificadorCompetencia(character.identity.level)
    : 0;
  return base + pb;
}

export function iniciativa(character: Character): number {
  const base =
    character.combat.initiativeOverride ?? modificadorAtributo(character.abilities.dex);
  return base + bonificadorIniciativaDotes(character);
}

export function percepcionPasiva(character: Character): number {
  return 10 + modificadorPericia(character, "perception");
}

export function velocidad(character: Character, base = 30): number {
  const baseSpeed = character.combat.speedOverride ?? base;
  const mods = calcularModificadoresCondiciones(
    character.combat.conditionIds,
    character.combat.exhaustionLevel,
  );
  if (mods.velocidadCero) return 0;
  return Math.max(0, Math.floor(baseSpeed * mods.multiplicadorVelocidad));
}
