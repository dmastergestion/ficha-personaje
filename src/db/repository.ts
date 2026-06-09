import { db } from "@/db";
import {
  CharacterSchema,
  TrackerExportSchema,
  type Character,
  type TrackerExport,
} from "@/schemas/character";
import { normalizarPersonaje } from "@/schemas/migrate";
import { sanitizarRecursos, recursosCompletos } from "@/rules/resources";
import { prepararPersonajeConjuro } from "@/rules/spell-cast";
import { iniciativa } from "@/rules/character";

export async function listarPersonajes(): Promise<Character[]> {
  const filas = await db.characters.orderBy("meta.updatedAt").reverse().toArray();
  return filas.flatMap((raw) => {
    const parsed = CharacterSchema.safeParse(raw);
    if (!parsed.success) return [];
    return [prepararPersonajeConjuro(sanitizarRecursos(parsed.data))];
  });
}

export async function obtenerPersonaje(id: string): Promise<Character | undefined> {
  const raw = await db.characters.get(id);
  if (!raw) return undefined;
  return prepararPersonajeConjuro(sanitizarRecursos(CharacterSchema.parse(raw)));
}

export async function guardarPersonaje(character: Character): Promise<void> {
  const parsed = CharacterSchema.parse({
    ...prepararPersonajeConjuro(sanitizarRecursos(character)),
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
  return normalizarPersonaje(raw);
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

export function nombreArchivoExport(prefix: string, name: string): string {
  const fecha = new Date().toISOString().slice(0, 10);
  const safe = name.replace(/[^\w\s-]/g, "").trim() || "personaje";
  return `${prefix}-${safe}-${fecha}.json`;
}

export async function duplicarPersonaje(id: string): Promise<Character | undefined> {
  const original = await obtenerPersonaje(id);
  if (!original) return undefined;

  const now = new Date().toISOString();
  const copia: Character = {
    ...structuredClone(original),
    id: crypto.randomUUID(),
    meta: { createdAt: now, updatedAt: now },
    identity: { ...original.identity, name: `${original.identity.name} (copia)` },
  };

  await guardarPersonaje(recursosCompletos(copia));
  return recursosCompletos(copia);
}
