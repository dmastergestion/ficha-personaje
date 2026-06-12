import type { AbilityKey, SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import spellListsJson from "@/data/srd/spell-lists.json";
import type { ClassLevel, Character } from "@/schemas/character";
import { maxPreparadosClase } from "@/rules/spell-progression";
import { clasesParaConjuros, esLanzador, espaciosMaximos } from "@/rules/spells";

export type SpellListEntry = {
  classes: string[];
  subclasses: { classId: string; subclassId: string }[];
};

const spellLists = spellListsJson as Record<string, SpellListEntry>;

/** Atributo de conjuro fijo por normas (PHB 2024). */
export const ATRIBUTO_CONJURO_CLASE: Partial<Record<string, AbilityKey>> = {
  bard: "cha",
  cleric: "wis",
  druid: "wis",
  wizard: "int",
  sorcerer: "cha",
  warlock: "cha",
  paladin: "cha",
  ranger: "wis",
};

const SUBCLASS_ATRIBUTO: Record<string, AbilityKey> = {
  "fighter:eldritch-knight": "int",
  "rogue:arcane-trickster": "int",
};

export function esSubclaseArcana(classId: string, subclassId: string | null): boolean {
  if (!subclassId) return false;
  return (
    (classId === "fighter" && subclassId === "eldritch-knight") ||
    (classId === "rogue" && subclassId === "arcane-trickster")
  );
}

/** Clases del personaje que tienen lista de conjuros (incluye EK / AT). */
export function clasesConListaConjuros(classes: ClassLevel[]): ClassLevel[] {
  return classes.filter(
    (cl) => esLanzador(cl.classId) || esSubclaseArcana(cl.classId, cl.subclassId),
  );
}

export function listaConjuro(spellId: string): SpellListEntry | undefined {
  return spellLists[spellId];
}

function nivelMaximoDesdeEspacios(slots: Record<SpellSlotLevel, number>): number {
  for (let i = SPELL_SLOT_LEVELS.length - 1; i >= 0; i--) {
    const level = SPELL_SLOT_LEVELS[i]!;
    if (slots[level] > 0) return Number(level);
  }
  return 0;
}

/** Nivel de conjuro más alto que la clase puede aprender o preparar. */
export function nivelMaximoConjuroClase(
  classId: string,
  classLevel: number,
  subclassId: string | null = null,
): number {
  if (esSubclaseArcana(classId, subclassId)) {
    const effective = Math.floor(classLevel / 3);
    if (effective < 1) return 0;
    return nivelMaximoDesdeEspacios(espaciosMaximos("wizard", effective));
  }
  if (!esLanzador(classId)) return 0;
  const fromSlots = nivelMaximoDesdeEspacios(espaciosMaximos(classId, classLevel));
  if (fromSlots > 0) return fromSlots;
  // Paladín / explorador preparan conjuros de nivel 1 antes de tener espacios (nivel 1).
  if (maxPreparadosClase(classId, classLevel) > 0) return 1;
  return 0;
}

/** Listas de clase que cuenta al filtrar (p. ej. Secretos mágicos del bardo 10+). */
export function listasFiltroClase(cl: ClassLevel): { classId: string; subclassId: string | null }[] {
  const bases: { classId: string; subclassId: string | null }[] = [
    { classId: cl.classId, subclassId: cl.subclassId },
  ];
  if (cl.classId === "bard" && cl.level >= 10) {
    for (const classId of ["cleric", "druid", "wizard"] as const) {
      bases.push({ classId, subclassId: null });
    }
  }
  return bases;
}

export function conjuroDisponibleParaClase(
  spellId: string,
  classId: string,
  subclassId: string | null,
): boolean {
  const entry = listaConjuro(spellId);
  if (!entry) return true;
  if (entry.classes.includes(classId)) return true;
  return entry.subclasses.some(
    (s) => s.classId === classId && s.subclassId === (subclassId ?? ""),
  );
}

export function conjuroDisponibleParaPersonaje(
  spellId: string,
  spellLevel: number,
  cl: ClassLevel,
): boolean {
  const maxLevel = nivelMaximoConjuroClase(cl.classId, cl.level, cl.subclassId);
  if (spellLevel > maxLevel) return false;
  return listasFiltroClase(cl).some((ref) =>
    conjuroDisponibleParaClase(spellId, ref.classId, ref.subclassId),
  );
}

export function atributoConjuroClase(
  classId: string,
  subclassId: string | null = null,
): AbilityKey | null {
  if (subclassId) {
    const fromSub = SUBCLASS_ATRIBUTO[`${classId}:${subclassId}`];
    if (fromSub) return fromSub;
  }
  return ATRIBUTO_CONJURO_CLASE[classId] ?? null;
}

/** Atributo por defecto según clases lanzadoras; null si hay varios atributos distintos. */
export function atributoConjuroPredeterminado(character: Character): AbilityKey | null {
  const casters = clasesConListaConjuros(clasesParaConjuros(character));
  if (casters.length === 0) return null;

  const abilities = new Set<AbilityKey>();
  for (const cl of casters) {
    const key = atributoConjuroClase(cl.classId, cl.subclassId);
    if (key) abilities.add(key);
  }

  if (abilities.size === 1) return [...abilities][0]!;

  const principal = [...casters].sort((a, b) => b.level - a.level)[0]!;
  return atributoConjuroClase(principal.classId, principal.subclassId);
}

export function atributoConjuroEsFijo(character: Character): boolean {
  const casters = clasesConListaConjuros(clasesParaConjuros(character));
  const abilities = new Set(
    casters
      .map((cl) => atributoConjuroClase(cl.classId, cl.subclassId))
      .filter((k): k is AbilityKey => k !== null && k !== undefined),
  );
  return abilities.size <= 1;
}
