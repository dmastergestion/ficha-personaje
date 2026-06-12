import classWeaponMasteryMeta from "@/data/srd/class-weapon-mastery-meta.json";
import weaponMasteryProperties from "@/data/srd/weapon-mastery-properties.json";
import { bonificadorCompetencia } from "@/rules/ability";
import { esCompetenteConArma } from "@/rules/proficiencies";
import { srdWeapons, t, type SrdWeapon } from "@/rules/srd";
import type { Character, ClassLevel } from "@/schemas/character";

type ClassMasteryMeta = {
  perLevel: Record<string, number>;
  meleeOnly?: boolean;
  requiresProficiency?: boolean;
};

const classMeta = classWeaponMasteryMeta as Record<string, ClassMasteryMeta>;
const masteryProps = weaponMasteryProperties as Record<
  string,
  { property: string; labelEs: string }
>;

export const CLASES_CON_MAESTRIA_ARMAS = Object.keys(classMeta);

export function claseTieneMaestriaArmas(classId: string): boolean {
  return classId in classMeta;
}

export function ranurasMaestriaClase(classId: string, level: number): number {
  const row = classMeta[classId];
  if (!row) return 0;
  let max = 0;
  for (const [lvl, count] of Object.entries(row.perLevel)) {
    if (level >= Number(lvl)) max = count;
  }
  return max;
}

export function ranurasMaestriaTotales(classes: ClassLevel[]): number {
  let total = 0;
  for (const cl of classes) {
    total += ranurasMaestriaClase(cl.classId, cl.level);
  }
  return total;
}

function esArmaCuerpoACuerpo(weapon: SrdWeapon): boolean {
  return weapon.category.endsWith("M");
}

function esArmaSimpleOMarcial(weapon: SrdWeapon): boolean {
  return weapon.category.startsWith("simple") || weapon.category.startsWith("martial");
}

export function armaElegibleMaestria(
  weapon: SrdWeapon,
  character: Character,
  classId: string,
): boolean {
  const row = classMeta[classId];
  if (!row) return false;
  if (!esArmaSimpleOMarcial(weapon)) return false;
  if (row.meleeOnly && !esArmaCuerpoACuerpo(weapon)) return false;
  if (row.requiresProficiency && !esCompetenteConArma(character, weapon.id)) return false;
  return true;
}

export function armasElegiblesMaestria(character: Character): SrdWeapon[] {
  const classIds = character.identity.classes
    .map((cl) => cl.classId)
    .filter((id) => claseTieneMaestriaArmas(id));

  if (classIds.length === 0) return [];

  return srdWeapons.filter((weapon) =>
    classIds.some((classId) => armaElegibleMaestria(weapon, character, classId)),
  );
}

export function etiquetaMaestriaArma(weaponId: string): string | null {
  return masteryProps[weaponId]?.labelEs ?? null;
}

export function resumenMaestriaArma(weaponId: string): string {
  const weapon = srdWeapons.find((w) => w.id === weaponId);
  const name = weapon ? t("weapons", weapon.id, weapon.nameEn) : weaponId;
  const prop = etiquetaMaestriaArma(weaponId);
  return prop ? `${name} (${prop})` : name;
}

export function maestriasArmasValidas(
  character: Character,
  picks: string[],
): { valid: boolean; message?: string } {
  const slots = ranurasMaestriaTotales(character.identity.classes);
  if (slots === 0) return { valid: picks.length === 0 };

  const unique = [...new Set(picks)];
  if (unique.length !== picks.length) {
    return { valid: false, message: "No puedes repetir el mismo tipo de arma." };
  }
  if (unique.length > slots) {
    return { valid: false, message: `Solo puedes elegir ${slots} maestrías de arma.` };
  }

  const eligible = new Set(armasElegiblesMaestria(character).map((w) => w.id));
  for (const id of unique) {
    if (!eligible.has(id)) {
      return { valid: false, message: "Una de las armas elegidas no es válida para tu clase." };
    }
  }

  return { valid: true };
}

export function ajustarMaestriasArmas(character: Character): Character {
  const slots = ranurasMaestriaTotales(character.identity.classes);
  if (slots === 0) {
    return character.weaponMasteries.length === 0
      ? character
      : { ...character, weaponMasteries: [] };
  }

  const eligible = new Set(armasElegiblesMaestria(character).map((w) => w.id));
  const trimmed = character.weaponMasteries
    .filter((id, index, arr) => arr.indexOf(id) === index && eligible.has(id))
    .slice(0, slots);

  if (
    trimmed.length === character.weaponMasteries.length &&
    trimmed.every((id, i) => id === character.weaponMasteries[i])
  ) {
    return character;
  }

  return { ...character, weaponMasteries: trimmed };
}

export function maestriasArmasCompletas(character: Character): boolean {
  const slots = ranurasMaestriaTotales(character.identity.classes);
  if (slots === 0) return true;
  return (
    character.weaponMasteries.length === slots &&
    maestriasArmasValidas(character, character.weaponMasteries).valid
  );
}

/** PB para fórmulas de recursos de rasgo. */
export function maxRecursoPorFormula(formula: string, level: number): number {
  if (formula === "pb") return Math.max(1, bonificadorCompetencia(level));
  const n = Number(formula);
  return Number.isFinite(n) ? n : 0;
}
