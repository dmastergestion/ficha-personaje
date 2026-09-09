import spellGrantMetaJson from "@/data/srd/spell-grant-meta.json";
import type { AbilityKey, ResourceRecharge, ResourceSource } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import {
  atributoListaIniciadoMagia,
  idInstanciaDote,
  MAGIC_INITIATE_LIST_LABELS,
  type MagicInitiateList,
} from "@/rules/feat-mechanics";
import type { OriginChoiceDefinition } from "@/rules/origin-choices";
import { idsEquivalentesConjuro } from "@/rules/spell-aliases";
import { conjuroDisponibleParaClase } from "@/rules/spell-lists";
import { maxRecursoPorFormula } from "@/rules/weapon-mastery";
import type { Character, CharacterResource, ClassLevel } from "@/schemas/character";

type SpellGrantResourceDef = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  max?: string;
  maxPerClassLevel?: Record<string, number>;
  maxFormula?: string;
  abilityModKey?: AbilityKey;
};

type SpellGrantEntryDef = {
  grantKey: string;
  spellId: string;
  level: number;
  minCharacterLevel?: number;
  minClassLevel?: number;
  classId?: string;
  alwaysPrepared?: boolean;
  abilityKey?: AbilityKey;
  abilityChoiceKey?: string;
  resource?: SpellGrantResourceDef;
};

type SpellGrantMetaFile = {
  feats: Record<string, SpellGrantEntryDef[]>;
  species: Record<string, SpellGrantEntryDef[]>;
  classes: Record<string, SpellGrantEntryDef[]>;
  subclasses: Record<string, SpellGrantEntryDef[]>;
  dynamicClassChoices: Record<
    string,
    {
      choiceKey: string;
      minClassLevel: number;
      spellLevel: number;
      resource: SpellGrantResourceDef;
    }[]
  >;
  dynamicFeatChoices?: Record<
    string,
    {
      choiceKey: string;
      spellLevel: number;
      resource: SpellGrantResourceDef;
    }[]
  >;
};

export type VinculoRecursoConjuro = {
  spellId: string;
  grantId: string;
  anchor: string;
};

const meta = spellGrantMetaJson as SpellGrantMetaFile;

const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export type SpellGrant = {
  grantId: string;
  spellId: string;
  level: number;
  abilityKey: AbilityKey;
  source: ResourceSource;
  sourceLabel: string;
  alwaysPrepared?: boolean;
  freeResourceId?: string;
  /** Sin botón Lanzar si el conjuro lo eliges al usar el recurso. */
  resourceOnly?: boolean;
};

function nivelClase(classes: ClassLevel[], classId: string): number {
  return classes.find((c) => c.classId === classId)?.level ?? 0;
}

function atributoEleccion(
  character: Character,
  abilityChoiceKey?: string,
  fallback?: AbilityKey,
): AbilityKey {
  if (abilityChoiceKey) {
    const raw = character.originChoices.species[abilityChoiceKey];
    if (raw && ABILITY_KEYS.includes(raw as AbilityKey)) return raw as AbilityKey;
  }
  return fallback ?? "cha";
}

function atributoLanzamientoDote(character: Character): AbilityKey {
  const mental: AbilityKey[] = ["int", "wis", "cha"];
  return mental.reduce((best, k) =>
    character.abilities[k] > character.abilities[best] ? k : best,
  );
}

function atributoGrant(
  character: Character,
  entry: SpellGrantEntryDef,
  opts: { source: ResourceSource; abilityKey?: AbilityKey },
): AbilityKey {
  if (entry.abilityKey) return entry.abilityKey;
  if (opts.abilityKey) return opts.abilityKey;
  if (entry.abilityChoiceKey) {
    return atributoEleccion(character, entry.abilityChoiceKey, entry.abilityKey);
  }
  if (opts.source === "feat") return atributoLanzamientoDote(character);
  return "cha";
}

function otorgamientoElegible(
  character: Character,
  entry: SpellGrantEntryDef,
  classLevel: number,
): boolean {
  if (character.identity.level < (entry.minCharacterLevel ?? 1)) return false;
  if (entry.minClassLevel != null && classLevel < entry.minClassLevel) return false;
  return true;
}

function maxRecursoOtorgamiento(
  character: Character,
  resource: SpellGrantResourceDef,
  classLevel: number,
): number {
  if (resource.maxPerClassLevel) {
    let max = 0;
    for (const [lvl, value] of Object.entries(resource.maxPerClassLevel)) {
      if (classLevel >= Number(lvl)) max = value;
    }
    return max;
  }
  const formula = resource.max ?? resource.maxFormula ?? "1";
  if (formula === "ability-mod-min-1" && resource.abilityModKey) {
    return Math.max(1, modificadorAtributo(character.abilities[resource.abilityModKey]));
  }
  return maxRecursoPorFormula(formula, character.identity.level, character.abilities);
}

function resourceId(
  source: ResourceSource,
  scopeId: string,
  resourceDefId: string,
  instanceSuffix?: string,
): string {
  const base = `${source}:${scopeId}:${resourceDefId}`;
  return instanceSuffix ? `${base}:${instanceSuffix}` : base;
}

function pushGrant(
  out: SpellGrant[],
  character: Character,
  entry: SpellGrantEntryDef,
  opts: {
    source: ResourceSource;
    scopeId: string;
    sourceLabel: string;
    classLevel: number;
    abilityKey?: AbilityKey;
  },
): void {
  if (!otorgamientoElegible(character, entry, opts.classLevel)) return;

  const ability = atributoGrant(character, entry, opts);

  const freeResourceId = entry.resource
    ? resourceId(opts.source, opts.scopeId, entry.resource.id)
    : undefined;

  const resourceOnly = !entry.spellId;

  out.push({
    grantId: `${opts.source}:${opts.scopeId}:${entry.grantKey}`,
    spellId: entry.spellId,
    level: entry.level,
    abilityKey: ability,
    source: opts.source,
    sourceLabel: opts.sourceLabel,
    alwaysPrepared: entry.alwaysPrepared,
    freeResourceId,
    resourceOnly,
  });
}

function grantsEstaticos(character: Character): SpellGrant[] {
  const out: SpellGrant[] = [];
  const { classes, speciesId, level } = character.identity;

  for (const feat of character.feats) {
    const instanceId = idInstanciaDote(feat);
    for (const entry of meta.feats[feat.id] ?? []) {
      pushGrant(out, character, entry, {
        source: "feat",
        scopeId: instanceId,
        sourceLabel: feat.name,
        classLevel: level,
      });
    }
  }

  if (speciesId) {
    for (const entry of meta.species[speciesId] ?? []) {
      pushGrant(out, character, entry, {
        source: "species",
        scopeId: speciesId,
        sourceLabel: speciesId,
        classLevel: level,
      });
    }
  }

  for (const cl of classes) {
    for (const entry of meta.classes[cl.classId] ?? []) {
      pushGrant(out, character, entry, {
        source: "class",
        scopeId: cl.classId,
        sourceLabel: cl.classId,
        classLevel: cl.level,
      });
    }

    if (cl.subclassId) {
      for (const entry of meta.subclasses[cl.subclassId] ?? []) {
        const classIdReq = entry.classId ?? cl.classId;
        if (classIdReq !== cl.classId) continue;
        pushGrant(out, character, entry, {
          source: "subclass",
          scopeId: cl.subclassId,
          sourceLabel: cl.subclassId,
          classLevel: cl.level,
        });
      }
    }

    for (const dyn of meta.dynamicClassChoices[cl.classId] ?? []) {
      if (cl.level < dyn.minClassLevel) continue;
      const spellId = character.originChoices.class[dyn.choiceKey];
      if (!spellId) continue;
      const abilityKey =
        cl.classId === "warlock" || cl.classId === "sorcerer" || cl.classId === "bard"
          ? "cha"
          : "int";
      out.push({
        grantId: `class:${cl.classId}:${dyn.choiceKey}`,
        spellId,
        level: dyn.spellLevel,
        abilityKey,
        source: "class",
        sourceLabel: cl.classId,
        alwaysPrepared: true,
        freeResourceId: resourceId("class", cl.classId, dyn.resource.id),
      });
    }
  }

  return out;
}

function grantsIniciadoMagia(character: Character): SpellGrant[] {
  const out: SpellGrant[] = [];
  for (const feat of character.feats) {
    if (feat.id !== "magic-initiate") continue;
    const list = feat.choices?.["spell-list"] as MagicInitiateList | undefined;
    if (!list) continue;
    const ability =
      (feat.choices?.["spell-ability"] as AbilityKey | undefined) ??
      atributoListaIniciadoMagia(list);
    const instanceId = idInstanciaDote(feat);
    const listLabel = MAGIC_INITIATE_LIST_LABELS[list] ?? list;

    for (const key of ["cantrip-1", "cantrip-2"] as const) {
      const spellId = feat.choices?.[key];
      if (!spellId) continue;
      out.push({
        grantId: `feat:${instanceId}:${key}`,
        spellId,
        level: 0,
        abilityKey: ability,
        source: "feat",
        sourceLabel: `${feat.name} · ${listLabel}`,
        alwaysPrepared: true,
      });
    }

    const spell1 = feat.choices?.["spell-1"];
    if (spell1) {
      out.push({
        grantId: `feat:${instanceId}:spell-1`,
        spellId: spell1,
        level: 1,
        abilityKey: ability,
        source: "feat",
        sourceLabel: `${feat.name} · ${listLabel}`,
        alwaysPrepared: true,
        freeResourceId: resourceId("feat", instanceId, "free-cast-1"),
      });
    }
  }
  return out;
}

function grantsDotesDinamicos(character: Character): SpellGrant[] {
  const out: SpellGrant[] = [];
  const dynamic = meta.dynamicFeatChoices ?? {};

  for (const feat of character.feats) {
    const list = dynamic[feat.id];
    if (!list?.length) continue;
    const instanceId = idInstanciaDote(feat);
    const ability = atributoLanzamientoDote(character);

    for (const dyn of list) {
      const spellId = feat.choices?.[dyn.choiceKey];
      if (!spellId) continue;
      out.push({
        grantId: `feat:${instanceId}:${dyn.choiceKey}`,
        spellId,
        level: dyn.spellLevel,
        abilityKey: ability,
        source: "feat",
        sourceLabel: feat.name,
        alwaysPrepared: true,
        freeResourceId: resourceId("feat", instanceId, dyn.resource.id),
      });
    }
  }

  return out;
}

/** Conjuros concedidos por rasgos (especie, clase, subclase, dotes). */
export function conjurosOtorgadosPersonaje(character: Character): SpellGrant[] {
  return [
    ...grantsEstaticos(character),
    ...grantsIniciadoMagia(character),
    ...grantsDotesDinamicos(character),
  ];
}

/** Otorgamientos con botón Lanzar en la ficha. */
export function conjurosOtorgadosLanzables(character: Character): SpellGrant[] {
  return conjurosOtorgadosPersonaje(character).filter((g) => g.spellId && !g.resourceOnly);
}

export const ETIQUETA_ORIGEN_CONJURO: Record<ResourceSource, string> = {
  feat: "Dote",
  species: "Especie",
  class: "Clase",
  subclass: "Subclase",
  background: "Trasfondo",
};

export type UsoLibreFicha = {
  restantes: number;
  max: number;
  resourceId: string;
  recharge: ResourceRecharge;
  source: ResourceSource;
  sourceLabel: string;
};

export type FilaConjuroFicha = {
  spellId: string;
  sePuedeQuitar: boolean;
  anotacion?: string;
  origenes?: { source: ResourceSource; sourceLabel: string }[];
  /** Un solo origen: atajo para tests y PDF. Varios orígenes → usar usosPorOrigen. */
  usosLibres?: { restantes: number; max: number };
  usosPorOrigen?: UsoLibreFicha[];
};

function anotacionConjurosRasgo(grants: SpellGrant[]): string | undefined {
  if (grants.length === 0) return undefined;
  const etiquetas = [
    ...new Set(grants.map((g) => ETIQUETA_ORIGEN_CONJURO[g.source])),
  ];
  return etiquetas.join(", ");
}

function usoLibreDeGrant(grant: SpellGrant, character: Character): UsoLibreFicha | undefined {
  if (!grant.freeResourceId) return undefined;
  const recurso = character.resources.find((r) => r.id === grant.freeResourceId);
  if (!recurso) return undefined;
  return {
    restantes: Math.max(0, recurso.max - recurso.used),
    max: recurso.max,
    resourceId: grant.freeResourceId,
    recharge: recurso.recharge,
    source: grant.source,
    sourceLabel: grant.sourceLabel,
  };
}

function origenesUnicosDeGrants(
  grants: SpellGrant[],
): { source: ResourceSource; sourceLabel: string }[] {
  const vistos = new Set<string>();
  const out: { source: ResourceSource; sourceLabel: string }[] = [];
  for (const grant of grants) {
    const clave = `${grant.source}:${grant.sourceLabel}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    out.push({ source: grant.source, sourceLabel: grant.sourceLabel });
  }
  return out;
}

function usosLibresDeGrants(grants: SpellGrant[], character: Character): UsoLibreFicha[] {
  const vistos = new Set<string>();
  const out: UsoLibreFicha[] = [];
  for (const grant of grants) {
    const uso = usoLibreDeGrant(grant, character);
    if (!uso || vistos.has(uso.resourceId)) continue;
    vistos.add(uso.resourceId);
    out.push(uso);
  }
  return out;
}

/** Lista de ficha: persistidos + rasgo, sin duplicar. */
export function filasConjurosFicha(
  character: Character,
  persistidos: readonly string[],
  grupo: "cantrip" | "leveled",
): FilaConjuroFicha[] {
  const grants = conjurosOtorgadosLanzables(character).filter((g) =>
    grupo === "cantrip" ? g.level === 0 : g.level > 0,
  );
  const porId = new Map<string, SpellGrant[]>();
  for (const grant of grants) {
    const lista = porId.get(grant.spellId) ?? [];
    lista.push(grant);
    porId.set(grant.spellId, lista);
  }

  const persistSet = new Set(persistidos);
  const ids: string[] = [];
  for (const id of persistidos) {
    if (!ids.includes(id)) ids.push(id);
  }
  for (const grant of grants) {
    if (!ids.includes(grant.spellId)) ids.push(grant.spellId);
  }

  return ids.map((spellId) => {
    const lista = porId.get(spellId) ?? [];
    const usosPorOrigen = usosLibresDeGrants(lista, character);
    const unico = usosPorOrigen.length === 1 ? usosPorOrigen[0] : undefined;
    return {
      spellId,
      sePuedeQuitar: persistSet.has(spellId),
      anotacion: anotacionConjurosRasgo(lista),
      origenes: origenesUnicosDeGrants(lista),
      usosLibres: unico
        ? { restantes: unico.restantes, max: unico.max }
        : undefined,
      usosPorOrigen: usosPorOrigen.length > 0 ? usosPorOrigen : undefined,
    };
  });
}

/** Ids que el personaje ya tiene en ficha (conocidos, preparados o de rasgo). */
export function idsConjurosAsignados(character: Character): Set<string> {
  const ids = [
    ...character.spells.cantripsKnown,
    ...character.spells.spellsKnown,
    ...character.spells.spellsPrepared,
    ...conjurosOtorgadosPersonaje(character)
      .filter((g) => g.spellId)
      .map((g) => g.spellId),
  ];
  return new Set(ids.flatMap((id) => idsEquivalentesConjuro(id)));
}

export function grantLanzableDeConjuro(
  character: Character,
  spellId: string,
): SpellGrant | undefined {
  return conjurosOtorgadosLanzables(character).find((g) => g.spellId === spellId);
}

/** @deprecated Usar conjurosOtorgadosPersonaje */
export function conjurosOtorgadosPorDotes(character: Character): SpellGrant[] {
  return conjurosOtorgadosPersonaje(character).filter((g) => g.source === "feat");
}

export function otorgamientosConjuro(
  character: Character,
  spellId: string,
): SpellGrant[] {
  return conjurosOtorgadosPersonaje(character).filter(
    (g) => g.spellId === spellId && g.freeResourceId,
  );
}

/** Conjuro de rasgo de nivel que solo puede gastarse con el recurso «sin espacio». */
export function conjuroRasgoConUsoGratis(
  character: Character,
  spellId: string,
  spellLevel: number,
): boolean {
  return spellLevel > 0 && otorgamientosConjuro(character, spellId).length > 0;
}

export function usosLibresRestantes(
  character: Character,
  resourceId: string,
): number {
  const r = character.resources.find((x) => x.id === resourceId);
  if (!r) return 0;
  return Math.max(0, r.max - r.used);
}

export function recursoLibreDisponible(character: Character, resourceId: string): boolean {
  return usosLibresRestantes(character, resourceId) > 0;
}

export function mejorRecursoLibreParaConjuro(
  character: Character,
  spellId: string,
): string | undefined {
  const grants = otorgamientosConjuro(character, spellId);
  for (const g of grants) {
    if (g.freeResourceId && recursoLibreDisponible(character, g.freeResourceId)) {
      return g.freeResourceId;
    }
  }
  return undefined;
}

/** Otorgamiento de conjuro vinculado a un recurso de uso sin espacio (p. ej. en Recursos). */
export function otorgamientoPorRecursoLibre(
  character: Character,
  recursoId: string,
): SpellGrant | undefined {
  return conjurosOtorgadosPersonaje(character).find(
    (g) => g.freeResourceId === recursoId && g.spellId,
  );
}

/** Ancla en Hechizos para un recurso de uso sin espacio. */
export function vinculoRecursoConjuro(
  character: Character,
  recursoId: string,
): VinculoRecursoConjuro | null {
  const grant = otorgamientoPorRecursoLibre(character, recursoId);
  if (!grant?.spellId) return null;
  return {
    spellId: grant.spellId,
    grantId: grant.grantId,
    anchor: `conjuro-rasgo-${grant.grantId}`,
  };
}

function pushRecurso(
  out: CharacterResource[],
  character: Character,
  resource: SpellGrantResourceDef,
  opts: {
    source: ResourceSource;
    scopeId: string;
    sourceLabel: string;
    classLevel: number;
  },
): void {
  const id = resourceId(opts.source, opts.scopeId, resource.id);
  if (out.some((r) => r.id === id)) return;
  out.push({
    id,
    name: `${resource.name} (${ETIQUETA_ORIGEN_CONJURO[opts.source]})`,
    max: maxRecursoOtorgamiento(character, resource, opts.classLevel),
    used: 0,
    recharge: resource.recharge,
    source: opts.source,
    sourceLabel: opts.sourceLabel,
  });
}

/** Recursos de usos sin espacio vinculados a conjuros otorgados. */
export function recursosConjurosOtorgados(character: Character): CharacterResource[] {
  const out: CharacterResource[] = [];
  const { classes, speciesId, level } = character.identity;

  for (const feat of character.feats) {
    const instanceId = idInstanciaDote(feat);
    for (const entry of meta.feats[feat.id] ?? []) {
      if (!entry.resource) continue;
      if (!otorgamientoElegible(character, entry, level)) continue;
      pushRecurso(out, character, entry.resource, {
        source: "feat",
        scopeId: instanceId,
        sourceLabel: feat.name,
        classLevel: level,
      });
    }
    if (feat.id === "magic-initiate" && feat.choices?.["spell-1"]) {
      pushRecurso(
        out,
        character,
        {
          id: "free-cast-1",
          name: "Conjuro niv. 1 sin espacio",
          recharge: "long",
          max: "1",
        },
        {
          source: "feat",
          scopeId: instanceId,
          sourceLabel: feat.name,
          classLevel: level,
        },
      );
    }
    for (const dyn of meta.dynamicFeatChoices?.[feat.id] ?? []) {
      if (!feat.choices?.[dyn.choiceKey]) continue;
      pushRecurso(out, character, dyn.resource, {
        source: "feat",
        scopeId: instanceId,
        sourceLabel: feat.name,
        classLevel: level,
      });
    }
  }

  if (speciesId) {
    for (const entry of meta.species[speciesId] ?? []) {
      if (!entry.resource) continue;
      if (!otorgamientoElegible(character, entry, level)) continue;
      pushRecurso(out, character, entry.resource, {
        source: "species",
        scopeId: speciesId,
        sourceLabel: speciesId,
        classLevel: level,
      });
    }
  }

  for (const cl of classes) {
    for (const entry of meta.classes[cl.classId] ?? []) {
      if (!entry.resource) continue;
      if (!otorgamientoElegible(character, entry, cl.level)) continue;
      pushRecurso(out, character, entry.resource, {
        source: "class",
        scopeId: cl.classId,
        sourceLabel: cl.classId,
        classLevel: cl.level,
      });
    }

    if (cl.subclassId) {
      for (const entry of meta.subclasses[cl.subclassId] ?? []) {
        if (!entry.resource) continue;
        if ((entry.classId ?? cl.classId) !== cl.classId) continue;
        if (!otorgamientoElegible(character, entry, cl.level)) continue;
        pushRecurso(out, character, entry.resource, {
          source: "subclass",
          scopeId: cl.subclassId,
          sourceLabel: cl.subclassId,
          classLevel: cl.level,
        });
      }
    }

    for (const dyn of meta.dynamicClassChoices[cl.classId] ?? []) {
      if (cl.level < dyn.minClassLevel) continue;
      if (!character.originChoices.class[dyn.choiceKey]) continue;
      pushRecurso(out, character, dyn.resource, {
        source: "class",
        scopeId: cl.classId,
        sourceLabel: cl.classId,
        classLevel: cl.level,
      });
    }
  }

  return out;
}

export function claseTieneEleccionesConjuro(classId: string, classes: ClassLevel[]): boolean {
  const clLevel = nivelClase(classes, classId);
  return (meta.dynamicClassChoices[classId] ?? []).some((dyn) => clLevel >= dyn.minClassLevel);
}

export function eleccionesConjurosClase(
  classId: string,
  classes: ClassLevel[],
  spells: { id: string; level: number; name: string }[],
): OriginChoiceDefinition[] {
  const clLevel = nivelClase(classes, classId);
  const defs: OriginChoiceDefinition[] = [];

  for (const dyn of meta.dynamicClassChoices[classId] ?? []) {
    if (clLevel < dyn.minClassLevel) continue;
    const options = spells
      .filter(
        (s) =>
          s.level === dyn.spellLevel && conjuroDisponibleParaClase(s.id, classId, null),
      )
      .map((s) => ({ value: s.id, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
    if (options.length === 0) continue;
    defs.push({
      id: dyn.choiceKey,
      scope: "class",
      label:
        dyn.choiceKey.startsWith("arcanum")
          ? `Arcanum místico (${dyn.spellLevel}.º)`
          : `Conjuro signature (${dyn.choiceKey === "signature-1" ? "1" : "2"})`,
      hint: "Siempre preparado; 1 uso sin espacio por descanso (corto en signature).",
      options,
      editable: "always",
    });
  }

  return defs;
}

function idsConjurosOtorgadosSet(character: Character): Set<string> {
  return new Set(
    conjurosOtorgadosPersonaje(character)
      .filter((g) => g.spellId)
      .flatMap((g) => idsEquivalentesConjuro(g.spellId)),
  );
}

/** Trucos concedidos por especie, dote, clase, etc. (no cuentan en el límite de trucos). */
export function idsTrucosOtorgados(character: Character): Set<string> {
  return new Set(
    conjurosOtorgadosPersonaje(character)
      .filter((g) => g.spellId && g.level === 0)
      .map((g) => g.spellId),
  );
}

/** Conjuros de nivel ≥1 siempre preparados por rasgos (no cuentan en preparados ni grimorio). */
export function idsConjurosOtorgadosPreparados(character: Character): Set<string> {
  return new Set(
    conjurosOtorgadosPersonaje(character)
      .filter((g) => g.spellId && g.level > 0)
      .map((g) => g.spellId),
  );
}

export function esConjuroOtorgadoPorRasgo(character: Character, spellId: string): boolean {
  return idsConjurosOtorgadosSet(character).has(spellId);
}

/** Quita de las listas persistidas los conjuros que ya conceden los rasgos. */
export function purificarListasConjuro(character: Character): Character {
  const otorgados = idsConjurosOtorgadosSet(character);
  if (otorgados.size === 0) return character;

  const filter = (ids: string[]) => ids.filter((id) => !otorgados.has(id));
  const spells = {
    ...character.spells,
    cantripsKnown: filter(character.spells.cantripsKnown),
    spellsKnown: filter(character.spells.spellsKnown),
    spellsPrepared: filter(character.spells.spellsPrepared),
  };

  if (
    spells.cantripsKnown.length === character.spells.cantripsKnown.length &&
    spells.spellsKnown.length === character.spells.spellsKnown.length &&
    spells.spellsPrepared.length === character.spells.spellsPrepared.length
  ) {
    return character;
  }

  return { ...character, spells };
}

export function sincronizarConjurosOtorgados(character: Character): Character {
  let next = purificarListasConjuro(character);
  const grants = conjurosOtorgadosPersonaje(next);
  if (grants.length > 0 && !next.spells.abilityKey) {
    const ability = grants[0]?.abilityKey;
    if (ability) {
      next = { ...next, spells: { ...next.spells, abilityKey: ability } };
    }
  }
  return next;
}

/** Etiqueta de usos sin espacio para UI. */
export function etiquetaUsosSinEspacio(character: Character, spellId: string): string | null {
  const grants = otorgamientosConjuro(character, spellId);
  if (grants.length === 0) return null;
  const parts = grants.map((g) => {
    if (!g.freeResourceId) return null;
    const rest = usosLibresRestantes(character, g.freeResourceId);
    const r = character.resources.find((x) => x.id === g.freeResourceId);
    const max = r?.max ?? rest;
    const origen = ETIQUETA_ORIGEN_CONJURO[g.source];
    return `${origen} ${rest}/${max}`;
  }).filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
