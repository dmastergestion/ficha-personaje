import type { SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { extraTrucosOrdenDivino } from "@/rules/class-equipment";
import type { OriginChoices } from "@/rules/origin-choices";
import { esSubclaseArcana } from "@/rules/spell-lists";
import {
  maxConjurosGrimorio,
  maxPreparadosClase,
  maxTrucosClase,
} from "@/rules/spell-progression";
import type { ClassLevel, Character } from "@/schemas/character";

/** Clases usadas para conjuros; corrige desincronización en personajes de una sola clase. */
export function clasesParaConjuros(character: Character): ClassLevel[] {
  const classes = character.identity.classes?.length
    ? [...character.identity.classes]
    : [
        {
          classId: character.identity.classId,
          subclassId: character.identity.subclassId,
          level: character.identity.level,
        },
      ];

  if (classes.length === 1) {
    const only = classes[0]!;
    if (only.level !== character.identity.level) {
      return [{ ...only, level: character.identity.level }];
    }
  }

  return classes;
}

export type SpellcastingKind = "full" | "half" | "pact" | "none";

const CLASS_SPELLCASTING: Record<string, SpellcastingKind> = {
  barbarian: "none",
  bard: "full",
  cleric: "full",
  druid: "full",
  fighter: "none",
  monk: "none",
  paladin: "half",
  ranger: "half",
  rogue: "none",
  sorcerer: "full",
  warlock: "pact",
  wizard: "full",
};

/** Tabla estándar SRD — lanzador completo (filas = nivel de personaje 1–20). */
const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Lanzador medio PHB 2024 (paladín, explorador): conjuros desde nivel 1. */
const HALF_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
];

/** Tercera parte PHB 2024 (caballero élfico, embustero arcano). Filas = nivel de clase 1–20. */
const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
];

/** Brujo — espacios de pacto (cantidad, nivel del espacio). */
const PACT_SLOTS: { count: number; level: number }[] = [
  { count: 1, level: 1 },
  { count: 2, level: 1 },
  { count: 2, level: 2 },
  { count: 2, level: 2 },
  { count: 2, level: 3 },
  { count: 2, level: 3 },
  { count: 2, level: 4 },
  { count: 2, level: 4 },
  { count: 2, level: 5 },
  { count: 2, level: 5 },
  { count: 3, level: 5 },
  { count: 3, level: 5 },
  { count: 3, level: 5 },
  { count: 3, level: 5 },
  { count: 3, level: 5 },
  { count: 3, level: 5 },
  { count: 4, level: 5 },
  { count: 4, level: 5 },
  { count: 4, level: 5 },
  { count: 4, level: 5 },
];

export function tipoLanzador(classId: string): SpellcastingKind {
  return CLASS_SPELLCASTING[classId] ?? "none";
}

function filaAEspacios(row: number[] | undefined): Record<SpellSlotLevel, number> {
  const empty = slotsVacios();
  if (!row) return empty;
  SPELL_SLOT_LEVELS.forEach((slotLevel, i) => {
    empty[slotLevel] = row[i] ?? 0;
  });
  return empty;
}

export function espaciosMaximos(
  classId: string,
  level: number,
  subclassId: string | null = null,
): Record<SpellSlotLevel, number> {
  const idx = Math.min(Math.max(level, 1), 20) - 1;
  const kind = tipoLanzador(classId);

  if (esSubclaseArcana(classId, subclassId)) {
    return filaAEspacios(THIRD_CASTER_SLOTS[idx]);
  }

  if (kind === "none") return slotsVacios();

  if (kind === "pact") {
    const empty = slotsVacios();
    const pact = PACT_SLOTS[idx];
    if (!pact) return empty;
    return { ...empty, [String(pact.level) as SpellSlotLevel]: pact.count };
  }

  const row = kind === "half" ? HALF_CASTER_SLOTS[idx] : FULL_CASTER_SLOTS[idx];
  return filaAEspacios(row);
}

export function esLanzador(classId: string): boolean {
  return tipoLanzador(classId) !== "none";
}

/** PHB 2024: las clases lanzadoras usan lista de conjuros preparados. */
export function usaListaPreparados(classId: string): boolean {
  return tipoLanzador(classId) !== "none";
}

function slotsVacios(): Record<SpellSlotLevel, number> {
  return Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, 0])) as Record<
    SpellSlotLevel,
    number
  >;
}

/** Nivel efectivo de conjuro multiclase SRD (sin brujo). */
export function nivelEfectivoConjuro(classes: ClassLevel[]): number {
  let total = 0;
  for (const { classId, level, subclassId } of classes) {
    const kind = tipoLanzador(classId);
    if (kind === "full") total += level;
    else if (kind === "half") total += Math.floor(level / 2);
    else if (esSubclaseArcana(classId, subclassId)) total += Math.floor(level / 3);
  }
  return Math.min(20, Math.max(0, total));
}

export function nivelBrujo(classes: ClassLevel[]): number {
  return classes.find((c) => c.classId === "warlock")?.level ?? 0;
}

function clasesConEspaciosNormales(classes: ClassLevel[]): ClassLevel[] {
  return classes.filter((c) => {
    const kind = tipoLanzador(c.classId);
    return kind === "full" || kind === "half" || esSubclaseArcana(c.classId, c.subclassId);
  });
}

export function espaciosMaximosPersonaje(character: Character): Record<SpellSlotLevel, number> {
  const classes = clasesParaConjuros(character);
  const lanzadoras = clasesConEspaciosNormales(classes);
  if (lanzadoras.length === 0) return slotsVacios();
  if (lanzadoras.length === 1) {
    const only = lanzadoras[0]!;
    return espaciosMaximos(only.classId, only.level, only.subclassId);
  }
  const effective = nivelEfectivoConjuro(classes);
  if (effective === 0) return slotsVacios();
  return espaciosMaximos("wizard", effective);
}

export function espaciosPactoMaximos(classes: ClassLevel[]): number {
  const wl = nivelBrujo(classes);
  if (wl === 0) return 0;
  const pact = espaciosMaximos("warlock", wl);
  return Math.max(...SPELL_SLOT_LEVELS.map((l) => pact[l]));
}

/** Nivel del espacio de pacto del brujo (0 si no es brujo). */
export function nivelEspacioPacto(classes: ClassLevel[]): number {
  const wl = nivelBrujo(classes);
  if (wl === 0) return 0;
  const idx = Math.min(Math.max(wl, 1), 20) - 1;
  return PACT_SLOTS[idx]?.level ?? 0;
}

/** Brujo sin otras clases lanzadoras: solo magia de pacto (siempre al nivel del espacio). */
export function esSoloMagiaPacto(character: Character): boolean {
  const classes = clasesParaConjuros(character);
  return nivelBrujo(classes) > 0 && nivelEfectivoConjuro(classes) === 0;
}

export function esLanzadorPersonaje(character: Character): boolean {
  const classes = clasesParaConjuros(character);
  return clasesConEspaciosNormales(classes).length > 0 || nivelBrujo(classes) > 0;
}

export function usaPreparadosMulticlase(classes: ClassLevel[]): boolean {
  return classes.some(
    (c) => usaListaPreparados(c.classId) || esSubclaseArcana(c.classId, c.subclassId),
  );
}

export function maxTrucosConocidos(
  classes: ClassLevel[],
  originChoices?: OriginChoices,
): number {
  let total = 0;
  for (const { classId, level, subclassId } of classes) {
    total += maxTrucosClase(classId, level);
    if (esSubclaseArcana(classId, subclassId)) {
      total += classId === "fighter" ? 2 : 3;
    }
    total += extraTrucosOrdenDivino(classId, originChoices);
  }
  return total;
}

export function maxConjurosPreparados(character: Character): number {
  const classes = clasesParaConjuros(character).filter(
    (c) => usaListaPreparados(c.classId) || esSubclaseArcana(c.classId, c.subclassId),
  );
  if (classes.length === 0) return 0;

  return classes.reduce((sum, c) => {
    if (esSubclaseArcana(c.classId, c.subclassId)) {
      const ekPrepared = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
      return sum + (ekPrepared[Math.min(Math.max(c.level, 1), 20) - 1] ?? 0);
    }
    return sum + maxPreparadosClase(c.classId, c.level);
  }, 0);
}

export function maxConjurosGrimorioPersonaje(character: Character): number {
  const classes = clasesParaConjuros(character);
  return classes.reduce((sum, c) => sum + maxConjurosGrimorio(c.classId, c.level), 0);
}

export function resumenConjuros(character: Character): {
  cantrips: { actual: number; max: number };
  prepared: { actual: number; max: number } | null;
  known: { actual: number; max?: number };
} {
  const classes = clasesParaConjuros(character);
  const preparados = usaPreparadosMulticlase(classes);

  return {
    cantrips: {
      actual: character.spells.cantripsKnown.length,
      max: maxTrucosConocidos(classes, character.originChoices),
    },
    prepared: preparados
      ? {
          actual: character.spells.spellsPrepared.length,
          max: maxConjurosPreparados(character),
        }
      : null,
    known: {
      actual: character.spells.spellsKnown.length,
      max: maxConjurosGrimorioPersonaje(character) || undefined,
    },
  };
}

export function compararConjurosPorNivel(
  levelA: number,
  nameA: string,
  levelB: number,
  nameB: string,
): number {
  if (levelA !== levelB) return levelA - levelB;
  return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
}

/** Ordena ids de conjuro por nivel y, a igualdad, por nombre. */
export function ordenarIdsConjuro(
  ids: readonly string[],
  metaDe: (id: string) => { level: number; name: string },
): string[] {
  return [...ids].sort((a, b) => {
    const ma = metaDe(a);
    const mb = metaDe(b);
    return compararConjurosPorNivel(ma.level, ma.name, mb.level, mb.name);
  });
}

/** Agrupa ids ya ordenados por nivel de conjuro (para listas de preparados). */
export function agruparIdsConjuroPorNivel(
  ids: readonly string[],
  metaDe: (id: string) => { level: number; name: string },
): { level: number; ids: string[] }[] {
  const grupos: { level: number; ids: string[] }[] = [];
  for (const id of ordenarIdsConjuro(ids, metaDe)) {
    const level = metaDe(id).level;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.level === level) ultimo.ids.push(id);
    else grupos.push({ level, ids: [id] });
  }
  return grupos;
}
