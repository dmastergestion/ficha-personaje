import { db } from "@/db";
import {
  CharacterSchema,
  TrackerExportSchema,
  type Character,
  type TrackerExport,
} from "@/schemas/character";
import { iniciativa } from "@/rules/character";

export async function listarPersonajes(): Promise<Character[]> {
  return db.characters.orderBy("meta.updatedAt").reverse().toArray();
}

export async function obtenerPersonaje(id: string): Promise<Character | undefined> {
  return db.characters.get(id);
}

export async function guardarPersonaje(character: Character): Promise<void> {
  const parsed = CharacterSchema.parse({
    ...character,
    meta: { ...character.meta, updatedAt: new Date().toISOString() },
  });
  await db.characters.put(parsed);
}

export async function eliminarPersonaje(id: string): Promise<void> {
  await db.characters.delete(id);
}

export function exportarBackup(character: Character): string {
  return JSON.stringify(CharacterSchema.parse(character), null, 2);
}

export function exportarTracker(character: Character, armorClass: number): string {
  const payload: TrackerExport = {
    nombre: character.identity.name,
    jugador: character.identity.playerName,
    nivel: character.identity.level,
    hp_max: character.combat.hpMax,
    hp_actual: character.combat.hpCurrent,
    ca: armorClass,
    iniciativa: iniciativa(character),
  };

  return JSON.stringify(TrackerExportSchema.parse(payload), null, 2);
}

export function importarPersonaje(json: string): Character {
  const raw: unknown = JSON.parse(json);
  return CharacterSchema.parse(raw);
}

export function descargarJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
