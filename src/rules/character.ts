import type { AbilityKey, SkillKey } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { calcularModificadoresCondiciones } from "@/rules/effects";
import type { Character } from "@/schemas/character";

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
  acrobatics: "Acrobacias",
  animalHandling: "Trato con animales",
  arcana: "Arcano",
  athletics: "Atletismo",
  deception: "Engaño",
  history: "Historia",
  insight: "Perspicacia",
  intimidation: "Intimidación",
  investigation: "Investigación",
  medicine: "Medicina",
  nature: "Naturaleza",
  perception: "Percepción",
  performance: "Interpretación",
  persuasion: "Persuasión",
  religion: "Religión",
  sleightOfHand: "Juego de manos",
  stealth: "Sigilo",
  survival: "Supervivencia",
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
  return (
    character.combat.initiativeOverride ?? modificadorAtributo(character.abilities.dex)
  );
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
