import { ID_CONJURO_SRD_A_PACK, idsEquivalentesConjuro } from "@/rules/spell-aliases";
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

/** Subclases que toman lista de mago (datos 5etools XPHB). */
const SUBCLASES_LISTA_MAGO: SpellListEntry["subclasses"] = [
  { classId: "bard", subclassId: "lore" },
  { classId: "fighter", subclassId: "eldritch-knight" },
  { classId: "rogue", subclassId: "arcane-trickster" },
];

function listaMago(clasesExtra: string[] = []): SpellListEntry {
  return {
    classes: [...new Set(["wizard", ...clasesExtra])].sort(),
    subclasses: SUBCLASES_LISTA_MAGO,
  };
}

/**
 * Conjuros SRD cuyo nameEn no coincide con 5etools (Risa horrible ≠ Tasha's…).
 * Sin esta tabla `listaConjuro` devolvía undefined y el filtro los daba a todas las clases.
 */
const LISTAS_NOMBRE_PROPIO: Record<string, SpellListEntry> = {
  "hideous-laughter": listaMago(["bard"]),
  "acid-arrow": listaMago(),
  "arcanists-magic-aura": listaMago(),
  "tiny-hut": listaMago(["bard"]),
  "black-tentacles": listaMago(),
  "faithful-hound": listaMago(),
  "private-sanctum": listaMago(),
  "resilient-sphere": listaMago(),
  "secret-chest": listaMago(),
  "arcane-hand": listaMago(),
  "telepathic-bond": listaMago(["bard"]),
  "freezing-sphere": listaMago(),
  "instant-summons": listaMago(),
  "irresistible-dance": listaMago(["bard"]),
  "arcane-sword": listaMago(),
  "magnificent-mansion": listaMago(["bard"]),
  "tensers-floating-disk": listaMago(),
};

function tablaListas(): Record<string, SpellListEntry> {
  const raw = spellListsJson as Record<string, SpellListEntry>;
  const cleaned: Record<string, SpellListEntry> = {};
  for (const [id, entry] of Object.entries(raw)) {
    cleaned[id] = {
      ...entry,
      classes: entry.classes.filter((c) => c !== "artificer"),
    };
  }
  const map: Record<string, SpellListEntry> = {
    ...cleaned,
    ...LISTAS_NOMBRE_PROPIO,
  };
  for (const [srdId, packId] of Object.entries(ID_CONJURO_SRD_A_PACK)) {
    const entry = map[srdId] ?? map[packId];
    if (!entry) continue;
    map[srdId] = entry;
    map[packId] = entry;
  }
  return map;
}

const spellLists = tablaListas();

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
  for (const id of idsEquivalentesConjuro(spellId)) {
    const entry = spellLists[id];
    if (entry) return entry;
  }
  return undefined;
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
  if (!entry) return false;
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

/** El conjuro no debe ofrecerse: ya está en ficha o es alias del mismo. */
export function conjuroYaEnFicha(spellId: string, idsOcupados: ReadonlySet<string>): boolean {
  return idsEquivalentesConjuro(spellId).some((id) => idsOcupados.has(id));
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
