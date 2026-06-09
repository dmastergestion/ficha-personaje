import type { SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { hitosMecanicos, rasgosEnNivel } from "@/rules/class-features";
import { sincronizarIdentidadMulticlase } from "@/rules/multiclass";
import classResourceMeta from "@/data/srd/class-resource-meta.json";
import { maxRecursoClase, poblarRecursosSugeridos, recursosSugeridos } from "@/rules/resources-tracker";
import {
  espaciosMaximosPersonaje,
  espaciosPactoMaximos,
  maxConjurosPreparados,
  maxTrucosConocidos,
  nivelEspacioPacto,
} from "@/rules/spells";
import { obtenerClase, t } from "@/rules/srd";
import type { ClassLevel, Character } from "@/schemas/character";

type ResourceMetaEntry = { id: string; name: string };
type ClassResourceMetaFile = Record<string, ResourceMetaEntry[]>;
const resourceMeta = classResourceMeta as ClassResourceMetaFile;

export interface HpGainOption {
  average: number;
  maximum: number;
  die: string;
  formula: string;
  isFirstLevelInClass: boolean;
}

export interface ResourceChange {
  name: string;
  before: number;
  after: number;
}

export interface SpellSlotChange {
  level: SpellSlotLevel;
  before: number;
  after: number;
}

export interface LevelUpPreview {
  classId: string;
  className: string;
  newClassLevel: number;
  totalLevelBefore: number;
  totalLevelAfter: number;
  hpGain: HpGainOption;
  pbBefore: number;
  pbAfter: number;
  features: { level: number; name: string; description: string }[];
  milestones: string[];
  spellSlots: SpellSlotChange[] | null;
  pactSlots: { before: number; after: number; slotLevel: number } | null;
  cantrips: { before: number; after: number } | null;
  prepared: { before: number; after: number } | null;
  resources: ResourceChange[];
  hitDieAdded: string;
}

export function pvGanadoAlSubir(
  classId: string,
  conScore: number,
  isFirstLevelInClass: boolean,
): HpGainOption {
  const hitDie = obtenerClase(classId)?.hitDie ?? "d8";
  const match = /^d(\d+)$/i.exec(hitDie.trim());
  const dieMax = match ? Number.parseInt(match[1] ?? "8", 10) : 8;
  const conMod = modificadorAtributo(conScore);
  const average = Math.floor(dieMax / 2) + 1 + conMod;
  const maximum = dieMax + conMod;

  if (isFirstLevelInClass) {
    return {
      average: maximum,
      maximum,
      die: hitDie,
      formula: `máx. ${hitDie} + CON (${maximum})`,
      isFirstLevelInClass: true,
    };
  }

  return {
    average,
    maximum,
    die: hitDie,
    formula: `${hitDie} + CON (promedio ${average}, máx. ${maximum})`,
    isFirstLevelInClass: false,
  };
}

export function detectarSubidaNivel(
  antes: ClassLevel[],
  despues: ClassLevel[],
): { classId: string; oldLevel: number; newLevel: number; isFirstLevelInClass: boolean } | null {
  const totalAntes = antes.reduce((s, c) => s + c.level, 0);
  const totalDespues = despues.reduce((s, c) => s + c.level, 0);
  if (totalDespues <= totalAntes) return null;

  for (const dep of despues) {
    const ant = antes.find((c) => c.classId === dep.classId);
    if (!ant) {
      return {
        classId: dep.classId,
        oldLevel: 0,
        newLevel: dep.level,
        isFirstLevelInClass: true,
      };
    }
    if (dep.level > ant.level) {
      return {
        classId: dep.classId,
        oldLevel: ant.level,
        newLevel: dep.level,
        isFirstLevelInClass: false,
      };
    }
  }
  return null;
}

function cambiosEspacios(
  antes: Record<SpellSlotLevel, number>,
  despues: Record<SpellSlotLevel, number>,
): SpellSlotChange[] {
  const changes: SpellSlotChange[] = [];
  for (const level of SPELL_SLOT_LEVELS) {
    if (antes[level] !== despues[level]) {
      changes.push({ level, before: antes[level], after: despues[level] });
    }
  }
  return changes;
}

function cambiosRecursos(antes: ClassLevel[], despues: ClassLevel[]): ResourceChange[] {
  const beforeMap = new Map(recursosSugeridos(antes).map((r) => [r.id, r.max]));
  const afterList = recursosSugeridos(despues);
  const changes: ResourceChange[] = [];

  for (const r of afterList) {
    const before = beforeMap.get(r.id) ?? 0;
    if (before !== r.max) {
      changes.push({ name: r.name, before, after: r.max });
    }
  }

  return changes;
}

/** Recursos que cambian solo por la clase que sube de nivel. */
export function recursosCambioClase(
  classId: string,
  oldLevel: number,
  newLevel: number,
): ResourceChange[] {
  const changes: ResourceChange[] = [];
  for (const entry of resourceMeta[classId] ?? []) {
    const before = maxRecursoClase(classId, entry.id, oldLevel);
    const after = maxRecursoClase(classId, entry.id, newLevel);
    if (before !== after) {
      changes.push({ name: entry.name, before, after });
    }
  }
  return changes;
}

export function prepararSubidaNivel(
  character: Character,
  newClasses: ClassLevel[],
): LevelUpPreview | null {
  const subida = detectarSubidaNivel(character.identity.classes, newClasses);
  if (!subida) return null;

  const { classId, oldLevel, newLevel, isFirstLevelInClass } = subida;
  const sync = sincronizarIdentidadMulticlase(newClasses);
  const charAntes: Character = {
    ...character,
    identity: { ...character.identity, classes: character.identity.classes },
  };
  const charDespues: Character = {
    ...character,
    identity: { ...character.identity, ...sync },
  };

  const pbBefore = bonificadorCompetencia(character.identity.level);
  const pbAfter = bonificadorCompetencia(sync.level);

  const slotsBefore = espaciosMaximosPersonaje(charAntes);
  const slotsAfter = espaciosMaximosPersonaje(charDespues);
  const slotChanges = cambiosEspacios(slotsBefore, slotsAfter);

  const pactBefore = espaciosPactoMaximos(character.identity.classes);
  const pactAfter = espaciosPactoMaximos(newClasses);

  const cantripsBefore = maxTrucosConocidos(character.identity.classes);
  const cantripsAfter = maxTrucosConocidos(newClasses);

  const preparedBefore = maxConjurosPreparados(charAntes);
  const preparedAfter = maxConjurosPreparados(charDespues);

  const resources =
    isFirstLevelInClass && oldLevel === 0
      ? cambiosRecursos(character.identity.classes, newClasses)
      : recursosCambioClase(classId, oldLevel, newLevel);

  const hitDie = obtenerClase(classId)?.hitDie ?? "d8";

  return {
    classId,
    className: t("classes", classId, classId),
    newClassLevel: newLevel,
    totalLevelBefore: character.identity.level,
    totalLevelAfter: sync.level,
    hpGain: pvGanadoAlSubir(classId, character.abilities.con, isFirstLevelInClass),
    pbBefore,
    pbAfter,
    features: rasgosEnNivel(classId, newLevel),
    milestones: hitosMecanicos(classId, newLevel),
    spellSlots: slotChanges.length > 0 ? slotChanges : null,
    pactSlots:
      pactBefore !== pactAfter
        ? {
            before: pactBefore,
            after: pactAfter,
            slotLevel: nivelEspacioPacto(newClasses),
          }
        : null,
    cantrips: cantripsBefore !== cantripsAfter ? { before: cantripsBefore, after: cantripsAfter } : null,
    prepared:
      preparedBefore !== preparedAfter
        ? { before: preparedBefore, after: preparedAfter }
        : null,
    resources,
    hitDieAdded: hitDie,
  };
}

export function aplicarSubidaNivel(
  character: Character,
  newClasses: ClassLevel[],
  hpGain: number,
  addToCurrentHp: boolean,
): Character {
  const sync = sincronizarIdentidadMulticlase(newClasses);
  const hpMax = Math.max(1, character.combat.hpMax + hpGain);
  const hpCurrent = addToCurrentHp
    ? Math.min(hpMax, character.combat.hpCurrent + hpGain)
    : Math.min(hpMax, character.combat.hpCurrent);

  const principal = sync.classId;
  const hitDie = obtenerClase(principal)?.hitDie ?? character.combat.hitDie;

  const updated: Character = {
    ...character,
    identity: { ...character.identity, ...sync },
    combat: {
      ...character.combat,
      hitDie,
      hpMax,
      hpCurrent,
      hitDiceTotal: sync.level,
    },
  };

  return poblarRecursosSugeridos(updated);
}

export function detectarBajadaNivel(
  antes: ClassLevel[],
  despues: ClassLevel[],
): {
  classId: string;
  oldLevel: number;
  newLevel: number;
  removedFromMulticlass: boolean;
} | null {
  const totalAntes = antes.reduce((s, c) => s + c.level, 0);
  const totalDespues = despues.reduce((s, c) => s + c.level, 0);
  if (totalDespues >= totalAntes) return null;

  for (const ant of antes) {
    const dep = despues.find((c) => c.classId === ant.classId);
    if (!dep) {
      return {
        classId: ant.classId,
        oldLevel: ant.level,
        newLevel: 0,
        removedFromMulticlass: true,
      };
    }
    if (dep.level < ant.level) {
      return {
        classId: ant.classId,
        oldLevel: ant.level,
        newLevel: dep.level,
        removedFromMulticlass: false,
      };
    }
  }
  return null;
}

function pvPerdidoAlBajar(
  classId: string,
  conScore: number,
  classLevelLost: number,
): number {
  return pvGanadoAlSubir(classId, conScore, classLevelLost === 1).average;
}

/** Revierte PV, dados y recursos al bajar de nivel (promedio del dado perdido). */
export function aplicarBajadaNivel(character: Character, newClasses: ClassLevel[]): Character {
  const bajada = detectarBajadaNivel(character.identity.classes, newClasses);
  const sync = sincronizarIdentidadMulticlase(newClasses);
  let hpMax = character.combat.hpMax;
  let hpCurrent = character.combat.hpCurrent;

  if (bajada) {
    if (bajada.removedFromMulticlass) {
      for (let lvl = bajada.oldLevel; lvl >= 1; lvl--) {
        const loss = pvPerdidoAlBajar(bajada.classId, character.abilities.con, lvl);
        hpMax = Math.max(1, hpMax - loss);
      }
    } else {
      const loss = pvPerdidoAlBajar(bajada.classId, character.abilities.con, bajada.newLevel + 1);
      hpMax = Math.max(1, hpMax - loss);
    }
    hpCurrent = Math.min(hpMax, hpCurrent);
  }

  const hitDie = obtenerClase(sync.classId)?.hitDie ?? character.combat.hitDie;

  return poblarRecursosSugeridos({
    ...character,
    identity: { ...character.identity, ...sync },
    combat: {
      ...character.combat,
      hitDie,
      hpMax,
      hpCurrent,
      hitDiceTotal: sync.level,
      hitDiceUsed: Math.min(character.combat.hitDiceUsed, sync.level),
    },
  });
}
