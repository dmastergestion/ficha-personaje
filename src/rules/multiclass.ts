import type { ClassLevel } from "@/schemas/character";
import { t } from "@/rules/srd";

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

export function validarClases(classes: ClassLevel[]): string | null {
  if (classes.length === 0) return "Añade al menos una clase.";
  const total = nivelTotalClases(classes);
  if (total < 1 || total > 20) return "La suma de niveles debe estar entre 1 y 20.";
  if (classes.some((c) => c.level < 1)) return "Cada clase debe tener al menos 1 nivel.";
  const ids = classes.map((c) => c.classId);
  if (new Set(ids).size !== ids.length) return "No repitas la misma clase.";
  return null;
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
