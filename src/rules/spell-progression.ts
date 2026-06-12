/** Tablas de conjuros preparados (columna Prepared Spells, PHB 2024 / SRD). */
const PREPARED_CLERIC_DRUID_BARD: number[] = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
];

const PREPARED_WIZARD: number[] = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 26,
];

const PREPARED_SORCERER: number[] = [
  2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
];

const PREPARED_WARLOCK: number[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
];

const PREPARED_PALADIN: number[] = [
  2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15,
];

/** Explorador — misma columna Prepared Spells que paladín en 2024 SRD. */
const PREPARED_RANGER: number[] = [...PREPARED_PALADIN];

const PREPARED_POR_CLASE: Record<string, number[]> = {
  bard: PREPARED_CLERIC_DRUID_BARD,
  cleric: PREPARED_CLERIC_DRUID_BARD,
  druid: PREPARED_CLERIC_DRUID_BARD,
  wizard: PREPARED_WIZARD,
  sorcerer: PREPARED_SORCERER,
  warlock: PREPARED_WARLOCK,
  paladin: PREPARED_PALADIN,
  ranger: PREPARED_RANGER,
};

const CANTRIPS_BARD: number[] = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];

const CANTRIPS_FULL: number[] = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];

const CANTRIPS_SORCERER = 4;

const CANTRIPS_WARLOCK: number[] = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];

function indiceNivel(level: number): number {
  return Math.min(Math.max(level, 1), 20) - 1;
}

export function maxPreparadosClase(classId: string, level: number): number {
  const tabla = PREPARED_POR_CLASE[classId];
  if (!tabla || level < 1) return 0;
  return tabla[indiceNivel(level)] ?? 0;
}

export function maxTrucosClase(classId: string, level: number): number {
  if (level < 1) return 0;
  if (classId === "sorcerer") return CANTRIPS_SORCERER;
  if (classId === "bard") return CANTRIPS_BARD[indiceNivel(level)] ?? 0;
  if (classId === "warlock") return CANTRIPS_WARLOCK[indiceNivel(level)] ?? 0;
  if (classId === "wizard" || classId === "cleric" || classId === "druid") {
    return CANTRIPS_FULL[indiceNivel(level)] ?? 0;
  }
  return 0;
}

/** Conjuros en el grimorio del mago (spellbook). */
export function maxConjurosGrimorio(classId: string, level: number): number {
  if (classId !== "wizard" || level < 1) return 0;
  return level === 1 ? 6 : 6 + 2 * (level - 1);
}

export function claseLanzaConjuros(classId: string, level: number): boolean {
  if (classId === "paladin" || classId === "ranger") return level >= 1;
  return classId in PREPARED_POR_CLASE;
}
