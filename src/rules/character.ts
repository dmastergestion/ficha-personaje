import type { AbilityKey, SkillKey } from "@/lib/constants";
import {
  ABILITY_SHEET_COLUMNS,
  SKILLS_BY_ABILITY,
  etiquetaPericiaOficial,
} from "@/lib/sheet-layout";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { calcularModificadoresCondiciones } from "@/rules/effects";
import { reduccionVelocidadAgotamiento } from "@/rules/edition";
import { bonificadorIniciativaDotes, periciasExtraDotes } from "@/rules/feat-mechanics";
import { penalizacionVelocidadArmaduraPesada } from "@/rules/combat";
import { obtenerArmadura } from "@/rules/srd";
import { atributosEfectivos, bestiaFormaActiva } from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";

export { ABILITY_SHEET_COLUMNS, SKILLS_BY_ABILITY };

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

export function esProficientePericia(character: Character, skill: SkillKey): boolean {
  if (skill in character.proficiencies.skillOverrides) {
    return character.proficiencies.skillOverrides[skill] ?? false;
  }
  if (periciasExtraDotes(character).includes(skill)) return true;
  return character.proficiencies.skills.includes(skill);
}

function esProficiente(character: Character, skill: SkillKey): boolean {
  return esProficientePericia(character, skill);
}

function tieneExpertise(character: Character, skill: SkillKey): boolean {
  return (character.proficiencies.expertise ?? []).includes(skill);
}

function nivelEnClase(character: Character, classId: string): number {
  return (
    character.identity.classes.find((c) => c.classId === classId)?.level ??
    (character.identity.classId === classId ? character.identity.level : 0)
  );
}

export function modificadorPericia(character: Character, skill: SkillKey): number {
  const ability = SKILL_ABILITIES[skill];
  const scores = atributosEfectivos(character);
  const base = modificadorAtributo(scores[ability]);
  const pb = bonificadorCompetencia(character.identity.level);
  const proficient = esProficiente(character, skill);
  let total = proficient
    ? base + (tieneExpertise(character, skill) ? pb * 2 : pb)
    : nivelEnClase(character, "bard") >= 2
      ? base + Math.floor(pb / 2)
      : base;
  if (
    (skill === "arcana" || skill === "religion") &&
    nivelEnClase(character, "cleric") >= 1 &&
    character.originChoices.class["divine-order"] === "thaumaturge"
  ) {
    total += Math.max(1, modificadorAtributo(atributosEfectivos(character).wis));
  }
  return total;
}

export function modificadorSalvacion(character: Character, ability: AbilityKey): number {
  const base = modificadorAtributo(atributosEfectivos(character)[ability]);
  const pb = character.proficiencies.savingThrows.includes(ability)
    ? bonificadorCompetencia(character.identity.level)
    : 0;
  return base + pb;
}

export function iniciativa(character: Character): number {
  const base =
    character.combat.initiativeOverride ??
    modificadorAtributo(atributosEfectivos(character).dex);
  return base + bonificadorIniciativaDotes(character);
}

export function percepcionPasiva(character: Character): number {
  return 10 + modificadorPericia(character, "perception");
}

function bonusVelocidadClase(character: Character): number {
  let bonus = 0;
  const armor = obtenerArmadura(character.equipment.armorId);
  const llevaPesada = armor?.category === "heavy";
  const llevaArmadura = !!armor && armor.category !== "shield";
  if (nivelEnClase(character, "barbarian") >= 5 && !llevaPesada) {
    bonus += 10;
  }
  const monk = nivelEnClase(character, "monk");
  if (monk >= 2 && !llevaArmadura && !character.equipment.shieldEquipped) {
    if (monk >= 18) bonus += 30;
    else if (monk >= 14) bonus += 25;
    else if (monk >= 10) bonus += 20;
    else if (monk >= 6) bonus += 15;
    else bonus += 10;
  }
  return bonus;
}

export function velocidad(character: Character, base = 30): number {
  const bestia = bestiaFormaActiva(character)?.combat;
  const baseSpeed = bestia
    ? (character.combat.speedOverride ?? bestia.speed)
    : (character.combat.speedOverride ?? base) + bonusVelocidadClase(character);
  const mods = calcularModificadoresCondiciones(
    character.combat.conditionIds,
    character.combat.exhaustionLevel,
  );
  if (mods.velocidadCero) return 0;
  const trasCondicion = Math.floor(baseSpeed * mods.multiplicadorVelocidad);
  const agotamiento = reduccionVelocidadAgotamiento(character.combat.exhaustionLevel);
  const armadura = bestia ? 0 : penalizacionVelocidadArmaduraPesada(character);
  return Math.max(0, trasCondicion - agotamiento - armadura);
}

export function tieneExpertisePericia(character: Character, skill: SkillKey): boolean {
  return (character.proficiencies.expertise ?? []).includes(skill);
}
