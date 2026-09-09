import classResourceMeta from "@/data/srd/class-resource-meta.json";
import traitResourceMeta from "@/data/srd/trait-resource-meta.json";
import type { ResourceRecharge, ResourceSource } from "@/lib/constants";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import { recursosDote } from "@/rules/feat-mechanics";
import { recursosConjurosOtorgados, sincronizarConjurosOtorgados } from "@/rules/spell-grants";
import { maxRecursoPorFormula } from "@/rules/weapon-mastery";
import type { ClassLevel, Character, CharacterResource } from "@/schemas/character";

type ResourceMetaEntry = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  perLevel?: Record<string, number>;
  maxFormula?: string;
  rechargeShortFromLevel?: number;
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

export function maxRecursoClase(
  classId: string,
  resourceId: string,
  level: number,
  abilities?: Character["abilities"],
): number {
  const entry = classMeta[classId]?.find((r) => r.id === resourceId);
  if (!entry) return 0;
  if (entry.maxFormula) {
    return maxRecursoPorFormula(entry.maxFormula, level, abilities);
  }

  let max = 0;
  for (const [lvl, value] of Object.entries(entry.perLevel ?? {})) {
    if (level >= Number(lvl)) max = value;
  }
  return max;
}

function recursosClase(
  classes: ClassLevel[],
  abilities?: Character["abilities"],
): CharacterResource[] {
  const byId = new Map<string, CharacterResource>();

  for (const { classId, level } of classes) {
    for (const entry of classMeta[classId] ?? []) {
      const max = maxRecursoClase(classId, entry.id, level, abilities);
      if (max <= 0) continue;
      const key = `${classId}:${entry.id}`;
      const recharge: ResourceRecharge =
        entry.rechargeShortFromLevel != null && level >= entry.rechargeShortFromLevel
          ? "short"
          : entry.recharge;
      const existing = byId.get(key);
      if (existing) {
        existing.max = Math.max(existing.max, max);
        if (recharge === "short") existing.recharge = "short";
      } else {
        byId.set(key, {
          id: key,
          name: entry.name,
          max,
          used: 0,
          recharge,
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
  abilities?: Character["abilities"],
): CharacterResource[] {
  if (!speciesId) return [];

  const groupId = inferSpeciesGroupId(speciesId);
  const entries = traitMeta[speciesId] ?? traitMeta[groupId] ?? [];

  return entries
    .filter((entry) => level >= (entry.minLevel ?? 1))
    .map((entry) => ({
    id: `species:${groupId}:${entry.id}`,
    name: entry.name,
    max: maxRecursoPorFormula(entry.maxFormula, level, abilities),
    used: 0,
    recharge: entry.recharge,
    source: "species" as const,
    sourceLabel: groupId,
  }));
}

export function recursosSugeridos(character: Character): CharacterResource[] {
  const fromClass = recursosClase(character.identity.classes, character.abilities);
  const fromSpecies = recursosEspecie(
    character.identity.speciesId,
    character.identity.level,
    character.abilities,
  );
  const fromFeats = recursosDote(character);

  const byId = new Map<string, CharacterResource>();
  for (const r of [...fromClass, ...fromSpecies, ...fromFeats]) {
    byId.set(r.id, r);
  }
  return [...byId.values()];
}

/** @deprecated Usar recursosSugeridos(character) */
export function recursosSugeridosClase(
  classes: ClassLevel[],
  abilities?: Character["abilities"],
): CharacterResource[] {
  return recursosClase(classes, abilities);
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
  const base = sincronizarConjurosOtorgados(character);
  const sugeridos = [...recursosSugeridos(base), ...recursosConjurosOtorgados(base)];
  const existentes = new Map(base.resources.map((r) => [r.id, r]));

  const byId = new Map<string, CharacterResource>();
  for (const s of sugeridos) {
    byId.set(s.id, fusionarRecurso(existentes.get(s.id) ?? byId.get(s.id), s));
  }

  const merged = [...byId.values()];
  for (const r of base.resources) {
    if (byId.has(r.id)) continue;
    // No conservar entradas de catálogo obsoletas (p. ej. invocaciones conocidas).
    if (
      r.source === "class" ||
      r.source === "species" ||
      r.source === "feat" ||
      r.source === "subclass"
    ) {
      continue;
    }
    merged.push(r);
  }

  return { ...base, resources: merged };
}

function firmaRecursosYConjuros(character: Character): string {
  const recursos = character.resources
    .map((r) => `${r.id}:${r.max}:${r.name}:${r.recharge}`)
    .sort()
    .join("|");
  const spells = [
    character.spells.abilityKey ?? "",
    ...character.spells.cantripsKnown,
    ...character.spells.spellsKnown,
    ...character.spells.spellsPrepared,
  ].join(",");
  return `${recursos}::${spells}`;
}

/** True si poblar cambiaría nombres, máximos o conjuros otorgados. */
export function hayQueSincronizarRecursos(character: Character): boolean {
  return firmaRecursosYConjuros(character) !== firmaRecursosYConjuros(poblarRecursosSugeridos(character));
}
