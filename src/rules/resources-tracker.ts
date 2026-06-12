import classResourceMeta from "@/data/srd/class-resource-meta.json";
import traitResourceMeta from "@/data/srd/trait-resource-meta.json";
import type { ResourceRecharge, ResourceSource } from "@/lib/constants";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import { recursosDote } from "@/rules/feat-mechanics";
import { maxRecursoPorFormula } from "@/rules/weapon-mastery";
import type { ClassLevel, Character, CharacterResource } from "@/schemas/character";

type ResourceMetaEntry = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  perLevel: Record<string, number>;
};

type TraitResourceEntry = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  maxFormula: string;
  minLevel?: number;
};

type ClassResourceMetaFile = Record<string, ResourceMetaEntry[]>;
type TraitResourceMetaFile = Record<string, TraitResourceEntry[]>;

const classMeta = classResourceMeta as unknown as ClassResourceMetaFile;
const traitMeta = traitResourceMeta as unknown as TraitResourceMetaFile;

const SOURCE_LABELS: Record<ResourceSource, string> = {
  class: "Clase",
  species: "Especie",
  feat: "Dote",
  background: "Trasfondo",
  subclass: "Subclase",
};

export function etiquetaOrigenRecurso(source: ResourceSource): string {
  return SOURCE_LABELS[source];
}

export function maxRecursoClase(classId: string, resourceId: string, level: number): number {
  const entry = classMeta[classId]?.find((r) => r.id === resourceId);
  if (!entry) return 0;

  let max = 0;
  for (const [lvl, value] of Object.entries(entry.perLevel)) {
    if (level >= Number(lvl)) max = value;
  }
  return max;
}

function recursosClase(classes: ClassLevel[]): CharacterResource[] {
  const byId = new Map<string, CharacterResource>();

  for (const { classId, level } of classes) {
    for (const entry of classMeta[classId] ?? []) {
      const max = maxRecursoClase(classId, entry.id, level);
      if (max <= 0) continue;
      const key = `${classId}:${entry.id}`;
      const existing = byId.get(key);
      if (existing) {
        existing.max = Math.max(existing.max, max);
      } else {
        byId.set(key, {
          id: key,
          name: entry.name,
          max,
          used: 0,
          recharge: entry.recharge,
          source: "class",
          sourceLabel: classId,
        });
      }
    }
  }

  return [...byId.values()];
}

function recursosEspecie(
  speciesId: string | null,
  level: number,
): CharacterResource[] {
  if (!speciesId) return [];

  const groupId = inferSpeciesGroupId(speciesId);
  const entries = traitMeta[speciesId] ?? traitMeta[groupId] ?? [];

  return entries
    .filter((entry) => level >= (entry.minLevel ?? 1))
    .map((entry) => ({
    id: `species:${groupId}:${entry.id}`,
    name: entry.name,
    max: maxRecursoPorFormula(entry.maxFormula, level),
    used: 0,
    recharge: entry.recharge,
    source: "species" as const,
    sourceLabel: groupId,
  }));
}

export function recursosSugeridos(character: Character): CharacterResource[] {
  const fromClass = recursosClase(character.identity.classes);
  const fromSpecies = recursosEspecie(
    character.identity.speciesId,
    character.identity.level,
  );
  const fromFeats = recursosDote(character);

  const byId = new Map<string, CharacterResource>();
  for (const r of [...fromClass, ...fromSpecies, ...fromFeats]) {
    byId.set(r.id, r);
  }
  return [...byId.values()];
}

/** @deprecated Usar recursosSugeridos(character) */
export function recursosSugeridosClase(classes: ClassLevel[]): CharacterResource[] {
  return recursosClase(classes);
}

export function ajustarRecurso(
  character: Character,
  resourceId: string,
  deltaUsed: number,
): Character {
  return {
    ...character,
    resources: character.resources.map((r) => {
      if (r.id !== resourceId) return r;
      const used = Math.min(r.max, Math.max(0, r.used + deltaUsed));
      return { ...r, used };
    }),
  };
}

export function aplicarRecargaRecursos(
  character: Character,
  tipo: "short" | "long",
): Character {
  return {
    ...character,
    resources: character.resources.map((r) => {
      if (r.recharge === "none") return r;
      if (tipo === "short" && r.recharge !== "short") return r;
      return { ...r, used: 0 };
    }),
  };
}

function fusionarRecurso(prev: CharacterResource | undefined, next: CharacterResource): CharacterResource {
  if (!prev) return { ...next, used: 0 };
  return {
    ...next,
    used: Math.min(next.max, prev.used),
  };
}

export function poblarRecursosSugeridos(character: Character): Character {
  const sugeridos = recursosSugeridos(character);
  const existentes = new Map(character.resources.map((r) => [r.id, r]));

  const merged = sugeridos.map((s) => fusionarRecurso(existentes.get(s.id), s));

  for (const r of character.resources) {
    if (!merged.some((m) => m.id === r.id)) merged.push(r);
  }

  return { ...character, resources: merged };
}
