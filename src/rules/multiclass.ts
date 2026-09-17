import type { AbilityKey } from "@/lib/constants";
import { etiquetaAtributoOficial } from "@/lib/sheet-layout";
import { nivelSubclase } from "@/rules/class-features";
import { srdSubclasses, obtenerClase, t } from "@/rules/srd";
import type { Character, ClassLevel } from "@/schemas/character";

const UMBRAL_MULTICLASE = 13;

/** PHB 2024: el guerrero pide FUE o DES; el resto de listas múltiples piden todas. */
function requisitoEsDisyuntivo(classId: string): boolean {
  return classId === "fighter";
}

export function nivelTotalClases(classes: ClassLevel[]): number {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

export function clasePrincipal(classes: ClassLevel[]): ClassLevel {
  return classes.reduce((a, b) => (b.level > a.level ? b : a), classes[0]!);
}

/** Sincroniza classId, subclassId y level total desde el array de clases. */
export function sincronizarIdentidadMulticlase(classes: ClassLevel[]): {
  classId: string;
  subclassId: string | null;
  level: number;
  classes: ClassLevel[];
} {
  const principal = clasePrincipal(classes);
  const level = nivelTotalClases(classes);
  return {
    classId: principal.classId,
    subclassId: principal.subclassId,
    level,
    classes,
  };
}

export function descripcionClases(classes: ClassLevel[]): string {
  return classes
    .map((c) => `${t("classes", c.classId, c.classId)} ${c.level}`)
    .join(" / ");
}

/** Línea de la lista: «Bárbaro 3»; con multiclase, «Bárbaro 3 / Mago 2 · Total 5». */
export function etiquetaListaPersonaje(classes: ClassLevel[], level: number): string {
  const desc = descripcionClases(classes);
  return classes.length > 1 ? `${desc} · Total ${level}` : desc;
}

/** Desglose de dados de golpe agrupados por denominación (ej. 10d10 + 2d6). */
export function dadosDeGolpePorClase(
  classes: ClassLevel[],
): { die: string; total: number }[] {
  const porDado = new Map<string, number>();
  for (const c of classes) {
    const die = obtenerClase(c.classId)?.hitDie ?? "d8";
    porDado.set(die, (porDado.get(die) ?? 0) + c.level);
  }
  return [...porDado.entries()]
    .map(([die, total]) => ({ die, total }))
    .sort((a, b) => {
      const fa = Number.parseInt(a.die.slice(1), 10) || 0;
      const fb = Number.parseInt(b.die.slice(1), 10) || 0;
      return fb - fa;
    });
}

/** Texto del desglose de dados de golpe (ej. "10d10 + 2d6"). */
export function descripcionDadosGolpe(classes: ClassLevel[]): string {
  return dadosDeGolpePorClase(classes)
    .map(({ die, total }) => `${total}${die}`)
    .join(" + ");
}

export function validarClases(classes: ClassLevel[]): string | null {
  if (classes.length === 0) return "Añade al menos una clase.";
  const total = nivelTotalClases(classes);
  if (total < 1 || total > 20) return "La suma de niveles debe estar entre 1 y 20.";
  if (classes.some((c) => c.level < 1)) return "Cada clase debe tener al menos 1 nivel.";
  const ids = classes.map((c) => c.classId);
  if (new Set(ids).size !== ids.length) return "No repitas la misma clase.";
  return null;
}

export function atributosRequisitoClase(classId: string): AbilityKey[] {
  return obtenerClase(classId)?.primaryAbilities ?? [];
}

export function textoRequisitoMulticlase(classId: string): string {
  const keys = atributosRequisitoClase(classId);
  if (keys.length === 0) return "";
  const partes = keys.map((k) => `${etiquetaAtributoOficial(k)} ${UMBRAL_MULTICLASE}`);
  const union = requisitoEsDisyuntivo(classId) ? " o " : " y ";
  return partes.join(union);
}

export function cumpleRequisitoClase(
  abilities: Character["abilities"],
  classId: string,
): boolean {
  const keys = atributosRequisitoClase(classId);
  if (keys.length === 0) return true;
  if (requisitoEsDisyuntivo(classId)) {
    return keys.some((k) => abilities[k] >= UMBRAL_MULTICLASE);
  }
  return keys.every((k) => abilities[k] >= UMBRAL_MULTICLASE);
}

/** Null si cada clase cumple su prerrequisito de atributo (también con una sola). */
export function errorRequisitoAtributos(
  classes: ClassLevel[],
  abilities: Character["abilities"],
): string | null {
  for (const { classId } of classes) {
    if (cumpleRequisitoClase(abilities, classId)) continue;
    const nombre = t("classes", classId, classId);
    const req = textoRequisitoMulticlase(classId);
    return `${nombre} requiere ${req}.`;
  }
  return null;
}

/** Null si el conjunto de clases cumple los prerrequisitos de atributo (PHB 2024). */
export function validarRequisitosMulticlase(
  classes: ClassLevel[],
  abilities: Character["abilities"],
): string | null {
  if (classes.length <= 1) return null;
  return errorRequisitoAtributos(classes, abilities);
}

export function agregarClase(classes: ClassLevel[], classId: string): ClassLevel[] | null {
  if (classes.some((c) => c.classId === classId)) return null;
  if (nivelTotalClases(classes) >= 20) return null;
  return [...classes, { classId, subclassId: null, level: 1 }];
}

export function eliminarClase(classes: ClassLevel[], classId: string): ClassLevel[] | null {
  if (classes.length <= 1) return null;
  return classes.filter((c) => c.classId !== classId);
}

/** Sube o baja el nivel total en 1 (clase principal al subir; al bajar, la que tenga nivel > 1). */
export function ajustarNivelTotal(classes: ClassLevel[], delta: number): ClassLevel[] | null {
  if (delta === 0) return classes;
  const total = nivelTotalClases(classes);
  if (delta > 0) {
    if (total >= 20) return null;
    const principal = clasePrincipal(classes);
    return actualizarNivelClase(classes, principal.classId, principal.level + 1);
  }
  if (total <= classes.length) return null;
  const principal = clasePrincipal(classes);
  if (principal.level > 1) {
    return actualizarNivelClase(classes, principal.classId, principal.level - 1);
  }
  const otra = classes.find((c) => c.classId !== principal.classId && c.level > 1);
  if (!otra) return null;
  return actualizarNivelClase(classes, otra.classId, otra.level - 1);
}

export function actualizarNivelClase(
  classes: ClassLevel[],
  classId: string,
  level: number,
): ClassLevel[] {
  const next = classes.map((c) =>
    c.classId === classId ? { ...c, level: Math.max(1, level) } : c,
  );
  const total = nivelTotalClases(next);
  if (total > 20) {
    const excess = total - 20;
    return next.map((c) =>
      c.classId === classId ? { ...c, level: Math.max(1, c.level - excess) } : c,
    );
  }
  return next;
}

export function puedeElegirSubclase(classLevel: ClassLevel): boolean {
  return classLevel.level >= nivelSubclase(classLevel.classId);
}

export function faltaElegirSubclase(classLevel: ClassLevel): boolean {
  return puedeElegirSubclase(classLevel) && !classLevel.subclassId;
}

export function subclaseValidaParaClase(classId: string, subclassId: string | null): boolean {
  if (!subclassId) return false;
  return srdSubclasses.some((sc) => sc.id === subclassId && sc.classId === classId);
}
