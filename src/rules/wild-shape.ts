import beastsJson from "@/data/srd/wild-shape-beasts.json";
import type { ClassLevel } from "@/schemas/character";

export const WILD_SHAPE_FORMS_KEY = "wild-shape-forms";

export type WildShapeBeast = {
  id: string;
  nameEs: string;
  cr: number;
  fly: boolean;
};

const BEASTS = beastsJson as WildShapeBeast[];

export const FORMAS_SALVAJE_RECOMENDADAS = ["rat", "riding-horse", "spider", "wolf"] as const;

export function nivelDruida(classes: ClassLevel[]): number {
  return classes.find((c) => c.classId === "druid")?.level ?? 0;
}

export function tieneFormaSalvaje(classes: ClassLevel[]): boolean {
  return nivelDruida(classes) >= 2;
}

/** Tabla Formas de bestia (SRD 2024). */
export function limitesFormaSalvaje(druidLevel: number): {
  maxFormas: number;
  maxCr: number;
  permiteVuelo: boolean;
} | null {
  if (druidLevel < 2) return null;
  if (druidLevel < 4) return { maxFormas: 4, maxCr: 0.25, permiteVuelo: false };
  if (druidLevel < 8) return { maxFormas: 6, maxCr: 0.5, permiteVuelo: false };
  return { maxFormas: 8, maxCr: 1, permiteVuelo: true };
}

export function catalogoBestias(): WildShapeBeast[] {
  return BEASTS;
}

export function bestiaPorId(id: string): WildShapeBeast | undefined {
  return BEASTS.find((b) => b.id === id);
}

export function bestiasElegibles(druidLevel: number): WildShapeBeast[] {
  const limites = limitesFormaSalvaje(druidLevel);
  if (!limites) return [];
  return BEASTS.filter(
    (b) => b.cr <= limites.maxCr && (limites.permiteVuelo || !b.fly),
  ).sort((a, b) => a.cr - b.cr || a.nameEs.localeCompare(b.nameEs, "es"));
}

export function etiquetaCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export function parsearFormasSalvaje(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function serializarFormasSalvaje(ids: string[]): string {
  return ids.join(",");
}

export function fusionarFormasSalvaje(
  druidLevel: number,
  actual: string | undefined,
): string {
  const limites = limitesFormaSalvaje(druidLevel);
  if (!limites) return "";

  const elegibles = new Set(bestiasElegibles(druidLevel).map((b) => b.id));
  const previas = parsearFormasSalvaje(actual).filter((id) => elegibles.has(id));
  const unicas = [...new Set(previas)];

  if (unicas.length === 0) {
    const defecto = FORMAS_SALVAJE_RECOMENDADAS.filter((id) => elegibles.has(id));
    return serializarFormasSalvaje(defecto.slice(0, limites.maxFormas));
  }

  return serializarFormasSalvaje(unicas.slice(0, limites.maxFormas));
}

export function formasSalvajeCompletas(druidLevel: number, raw: string | undefined): boolean {
  const limites = limitesFormaSalvaje(druidLevel);
  if (!limites) return true;
  const ids = parsearFormasSalvaje(fusionarFormasSalvaje(druidLevel, raw));
  if (ids.length !== limites.maxFormas) return false;
  const elegibles = new Set(bestiasElegibles(druidLevel).map((b) => b.id));
  return ids.every((id) => elegibles.has(id));
}

export function resumenFormasSalvaje(druidLevel: number, raw: string | undefined): string[] {
  return parsearFormasSalvaje(fusionarFormasSalvaje(druidLevel, raw)).map((id) => {
    const b = bestiaPorId(id);
    return b ? `${b.nameEs} (ID ${etiquetaCr(b.cr)})` : id;
  });
}
