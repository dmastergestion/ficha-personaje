import type { AbilityKey, SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
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

/** Lanzador medio (paladín, explorador). */
const HALF_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
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

export function espaciosMaximos(
  classId: string,
  level: number,
): Record<SpellSlotLevel, number> {
  const empty = Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, 0])) as Record<
    SpellSlotLevel,
    number
  >;

  const idx = Math.min(Math.max(level, 1), 20) - 1;
  const kind = tipoLanzador(classId);

  if (kind === "none") return empty;

  if (kind === "pact") {
    const pact = PACT_SLOTS[idx];
    if (!pact) return empty;
    return { ...empty, [String(pact.level) as SpellSlotLevel]: pact.count };
  }

  const row = kind === "half" ? HALF_CASTER_SLOTS[idx] : FULL_CASTER_SLOTS[idx];
  SPELL_SLOT_LEVELS.forEach((slotLevel, i) => {
    empty[slotLevel] = row[i] ?? 0;
  });
  return empty;
}

export function esLanzador(classId: string): boolean {
  return tipoLanzador(classId) !== "none";
}

/** Clérigo, druida y mago preparan conjuros; el resto usa lista conocida. */
export function usaListaPreparados(classId: string): boolean {
  return classId === "wizard" || classId === "cleric" || classId === "druid";
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
  for (const { classId, level } of classes) {
    const kind = tipoLanzador(classId);
    if (kind === "full") total += level;
    else if (kind === "half") total += Math.floor(level / 2);
  }
  return Math.min(20, Math.max(0, total));
}

export function nivelBrujo(classes: ClassLevel[]): number {
  return classes.find((c) => c.classId === "warlock")?.level ?? 0;
}

export function espaciosMaximosPersonaje(character: Character): Record<SpellSlotLevel, number> {
  const classes = clasesParaConjuros(character);
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

export function esLanzadorPersonaje(character: Character): boolean {
  const classes = clasesParaConjuros(character);
  return nivelEfectivoConjuro(classes) > 0 || nivelBrujo(classes) > 0;
}

export function usaPreparadosMulticlase(classes: ClassLevel[]): boolean {
  return classes.some((c) => usaListaPreparados(c.classId));
}

function cantripsLanzadorCompleto(level: number): number {
  if (level >= 10) return 5;
  if (level >= 4) return 4;
  return 3;
}

const CANTARIPS_POR_CLASE: Record<string, (level: number) => number> = {
  bard: cantripsLanzadorCompleto,
  cleric: cantripsLanzadorCompleto,
  druid: cantripsLanzadorCompleto,
  sorcerer: cantripsLanzadorCompleto,
  wizard: cantripsLanzadorCompleto,
  warlock: (level) => (level >= 10 ? 4 : level >= 4 ? 3 : 2),
};

export function maxTrucosConocidos(classes: ClassLevel[]): number {
  let total = 0;
  for (const { classId, level } of classes) {
    const fn = CANTARIPS_POR_CLASE[classId];
    if (fn) total += fn(level);
  }
  return total;
}

export function maxConjurosPreparados(character: Character): number {
  const classes = clasesParaConjuros(character).filter((c) =>
    usaListaPreparados(c.classId),
  );
  if (classes.length === 0) return 0;

  const key: AbilityKey =
    character.spells.abilityKey ??
    (classes[0]!.classId === "cleric" || classes[0]!.classId === "druid"
      ? "wis"
      : "int");
  const mod = modificadorAtributo(character.abilities[key]);

  return classes.reduce((sum, c) => sum + Math.max(1, c.level + mod), 0);
}

export function resumenConjuros(character: Character): {
  cantrips: { actual: number; max: number };
  prepared: { actual: number; max: number } | null;
  known: { actual: number };
} {
  const classes = clasesParaConjuros(character);
  const preparados = usaPreparadosMulticlase(classes);

  return {
    cantrips: {
      actual: character.spells.cantripsKnown.length,
      max: maxTrucosConocidos(classes),
    },
    prepared: preparados
      ? {
          actual: character.spells.spellsPrepared.length,
          max: maxConjurosPreparados(character),
        }
      : null,
    known: { actual: character.spells.spellsKnown.length },
  };
}
