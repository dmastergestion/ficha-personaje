import classFeatureMeta from "@/data/srd/class-feature-meta.json";
import subclassFeatureMeta from "@/data/srd/subclass-feature-meta.json";

export type ClassFeatureEntry = { level: number; name: string; description: string };
type FeatureMetaFile = Record<string, ClassFeatureEntry[]>;

const features = classFeatureMeta as FeatureMetaFile;
const subclassFeatures = subclassFeatureMeta as FeatureMetaFile;

/** IDs equivalentes (SRD `hand` vs meta PHB `open-hand`). */
export const SUBCLASS_ID_ALIASES: Record<string, string[]> = {
  hand: ["open-hand"],
  "open-hand": ["hand"],
};

/** Nivel en el que se elige subclase (2024 PHB). */
const SUBCLASS_LEVEL: Record<string, number> = {
  warlock: 3,
  barbarian: 3,
  bard: 3,
  cleric: 3,
  druid: 3,
  fighter: 3,
  monk: 3,
  paladin: 3,
  ranger: 3,
  rogue: 3,
  sorcerer: 3,
  wizard: 3,
};

/** Niveles con mejora de atributos o dote épica (2024). */
const ASI_LEVELS: Record<string, number[]> = {
  barbarian: [4, 8, 12, 16, 19],
  bard: [4, 8, 12, 16, 19],
  cleric: [4, 8, 12, 16, 19],
  druid: [4, 8, 12, 16, 19],
  fighter: [4, 6, 8, 12, 14, 16, 19],
  monk: [4, 8, 12, 16, 19],
  paladin: [4, 8, 12, 16, 19],
  ranger: [4, 8, 12, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19],
  sorcerer: [4, 8, 12, 16, 19],
  warlock: [4, 8, 12, 16, 19],
  wizard: [4, 8, 12, 16, 19],
};

/** Niveles con rasgo de subclase adicional. */
const SUBCLASS_FEATURE_LEVELS: Record<string, number[]> = {
  barbarian: [6, 10, 14],
  bard: [6, 14],
  cleric: [6, 8, 12, 17],
  druid: [6, 10, 14],
  fighter: [7, 10, 15, 18],
  monk: [6, 11, 17],
  paladin: [7, 11, 15, 18],
  ranger: [7, 11, 15],
  rogue: [9, 13, 17],
  sorcerer: [6, 14, 18],
  warlock: [6, 10, 14],
  wizard: [6, 10, 14],
};

export function rasgosDeClase(classId: string): ClassFeatureEntry[] {
  return features[classId] ?? [];
}

export function rasgosDeSubclase(subclassId: string): ClassFeatureEntry[] {
  const direct = subclassFeatures[subclassId];
  if (direct?.length) return direct;
  for (const alt of SUBCLASS_ID_ALIASES[subclassId] ?? []) {
    const rows = subclassFeatures[alt];
    if (rows?.length) return rows;
  }
  return [];
}

export function rasgosEnNivel(classId: string, level: number): ClassFeatureEntry[] {
  return rasgosDeClase(classId).filter((f) => f.level === level);
}

export function rasgosHastaNivel(
  classId: string,
  level: number,
  subclassId?: string | null,
): ClassFeatureEntry[] {
  const base = rasgosDeClase(classId).filter((f) => f.level <= level);
  if (!subclassId) return base;
  const sub = rasgosDeSubclase(subclassId).filter((f) => f.level <= level);
  return [...base, ...sub].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "es"));
}

export function nivelSubclase(classId: string): number {
  return SUBCLASS_LEVEL[classId] ?? 3;
}

export function hitosMecanicos(classId: string, level: number): string[] {
  const hitos: string[] = [];

  if (ASI_LEVELS[classId]?.includes(level)) {
    hitos.push(
      level === 19
        ? "Dote épica: elige una dote épica o +2 a un atributo / +1 a dos."
        : "Mejora de atributos: +2 a un atributo o +1 a dos (o dote si tu mesa lo permite).",
    );
  }

  if (nivelSubclase(classId) === level) {
    hitos.push("Elige tu subclase (rama de la clase).");
  }

  if (SUBCLASS_FEATURE_LEVELS[classId]?.includes(level)) {
    hitos.push("Nuevo rasgo de subclase.");
  }

  if (level === 5 && ["barbarian", "fighter", "monk", "paladin", "ranger"].includes(classId)) {
    hitos.push("Ataque adicional al usar la acción Atacar.");
  }

  if (level === 17 && classId === "fighter") {
    hitos.push("Dos usos de Oleada de acción por descanso corto o largo.");
  }

  if (level === 20) {
    hitos.push("Rasgo de nivel 20 de la clase.");
  }

  if (classId === "rogue" && (level === 1 || level === 6)) {
    hitos.push("Expertise: elige 2 pericias competentes (doble PB).");
  }
  if (classId === "bard" && (level === 2 || level === 9)) {
    hitos.push("Expertise: elige 2 pericias competentes (doble PB).");
  }
  if (classId === "ranger" && level === 9) {
    hitos.push("Expertise: elige 2 pericias competentes (doble PB).");
  }

  return hitos;
}

const ETIQUETA_SUBCLASE: Record<string, string> = {
  barbarian: "Senda",
  bard: "Colegio",
  cleric: "Dominio",
  druid: "Círculo",
  fighter: "Arquetipo",
  monk: "Tradición",
  paladin: "Juramento",
  ranger: "Arquetipo",
  rogue: "Arquetipo",
  sorcerer: "Linaje",
  warlock: "Patrono",
  wizard: "Tradición",
};

export function etiquetaSelectorSubclase(classId: string): string {
  return ETIQUETA_SUBCLASE[classId] ?? "Subclase";
}

/** Niveles con ASI / dote de la clase (para el asistente y la ficha). */
export function nivelesMejoraAtributos(classId: string): number[] {
  return ASI_LEVELS[classId] ?? [];
}

export function esNivelMejoraAtributos(classId: string, level: number): boolean {
  return nivelesMejoraAtributos(classId).includes(level);
}

export function cantidadMejorasAtributosHastaNivel(classId: string, level: number): number {
  return nivelesMejoraAtributos(classId).filter((n) => n <= level).length;
}

export function periciasExpertiseAlNivel(classId: string, level: number): number {
  if (classId === "rogue" && (level === 1 || level === 6)) return 2;
  if (classId === "bard" && (level === 2 || level === 9)) return 2;
  if (classId === "ranger" && level === 9) return 2;
  return 0;
}

/** Expertise acumulada hasta ese nivel de clase (creación y validación). */
export function cantidadExpertiseHastaNivel(classId: string, level: number): number {
  let total = 0;
  for (let n = 1; n <= level; n++) total += periciasExpertiseAlNivel(classId, n);
  return total;
}
