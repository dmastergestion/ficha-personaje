import classSkillMeta from "@/data/srd/class-skill-meta.json";
import type { SkillKey } from "@/lib/constants";
import { SKILL_KEYS } from "@/lib/constants";
import { SKILL_LABELS_ES } from "@/rules/character";

type ClassSkillEntry = {
  count: number;
  skills: SkillKey[] | "any";
};

const meta = classSkillMeta as Record<string, ClassSkillEntry>;

export function metaPericiasClase(classId: string): ClassSkillEntry | undefined {
  return meta[classId];
}

export function opcionesPericiaClase(classId: string | null | undefined): SkillKey[] {
  if (!classId) return [];
  const entry = meta[classId];
  if (!entry) return [];
  if (entry.skills === "any") return [...SKILL_KEYS];
  return entry.skills;
}

export function cantidadPericiasClase(classId: string | null | undefined): number {
  if (!classId) return 0;
  return meta[classId]?.count ?? 0;
}

export function clavePericiaClase(index: number): string {
  return `skill-${index + 1}`;
}

export function periciasClaseDesdeElecciones(
  classId: string | null,
  classChoices: Record<string, string> = {},
): SkillKey[] {
  const count = cantidadPericiasClase(classId);
  const allowed = new Set(opcionesPericiaClase(classId));
  const picked: SkillKey[] = [];
  for (let i = 0; i < count; i++) {
    const raw = classChoices[clavePericiaClase(i)];
    if (raw && allowed.has(raw as SkillKey) && !picked.includes(raw as SkillKey)) {
      picked.push(raw as SkillKey);
    }
  }
  return picked;
}

export function periciasClaseCompletas(
  classId: string | null,
  classChoices: Record<string, string> = {},
): boolean {
  const count = cantidadPericiasClase(classId);
  if (count <= 0) return true;
  return periciasClaseDesdeElecciones(classId, classChoices).length === count;
}

export function etiquetaPericiaClase(skill: SkillKey): string {
  return SKILL_LABELS_ES[skill] ?? skill;
}
