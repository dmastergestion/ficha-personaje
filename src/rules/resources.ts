import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { espaciosUsadosSeguros } from "@/rules/rests";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import { espaciosMaximosPersonaje, espaciosPactoMaximos } from "@/rules/spells";
import type { Character, CharacterFeat } from "@/schemas/character";

function slotsVacios(): Character["spells"]["spellSlotsUsed"] {
  return Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, 0])) as Character["spells"]["spellSlotsUsed"];
}

/**
 * PV máximos estilo 5e: nivel 1 = máximo del dado + CON;
 * niveles siguientes = promedio del dado (redondeado hacia arriba) + CON.
 */
export function pvMaximoPersonaje(hitDie: string, conScore: number, level: number): number {
  const match = /^d(\d+)$/i.exec(hitDie.trim());
  const dieMax = match ? Number.parseInt(match[1] ?? "8", 10) : 8;
  const conMod = modificadorAtributo(conScore);
  const lvl = Math.max(1, level);
  const promedioPorNivel = Math.floor(dieMax / 2) + 1;
  const nivel1 = dieMax + conMod;
  const nivelesExtra = (lvl - 1) * (promedioPorNivel + conMod);
  return Math.max(1, nivel1 + nivelesExtra);
}

export function esEnano(speciesId: string | null | undefined): boolean {
  if (!speciesId) return false;
  return inferSpeciesGroupId(speciesId) === "dwarf" || speciesId.startsWith("dwarf");
}

/** Dwarven Toughness: +1 PG por nivel de personaje. */
export function bonusPgEnano(speciesId: string | null | undefined, level: number): number {
  return esEnano(speciesId) ? Math.max(1, level) : 0;
}

export function tieneDoteRobustez(feats: readonly Pick<CharacterFeat, "id">[]): boolean {
  return feats.some((f) => f.id === "tough");
}

/** Dote Robustez: +2 PG por nivel de personaje. */
export function bonusPgRobustez(
  feats: readonly Pick<CharacterFeat, "id">[],
  level: number,
): number {
  return tieneDoteRobustez(feats) ? 2 * Math.max(1, level) : 0;
}

export function aplicarDeltaPg(character: Character, delta: number): Character {
  if (delta === 0) return character;
  const hpMax = Math.max(1, character.combat.hpMax + delta);
  const hpCurrent = Math.min(hpMax, Math.max(0, character.combat.hpCurrent + delta));
  return {
    ...character,
    combat: { ...character.combat, hpMax, hpCurrent },
  };
}

/** PHB 2024: el máximo de PG cambia como si el nuevo mod de CON hubiera estado desde nivel 1. */
export function ajustarPgPorCambioCon(
  character: Character,
  oldCon: number,
  newCon: number,
): Character {
  const level = Math.max(1, character.identity.level);
  const delta =
    (modificadorAtributo(newCon) - modificadorAtributo(oldCon)) * level;
  return aplicarDeltaPg(character, delta);
}

export function sincronizarPgPorDotes(antes: Character, next: Character): Character {
  const level = Math.max(1, next.identity.level);
  const delta =
    bonusPgRobustez(next.feats, level) - bonusPgRobustez(antes.feats, level);
  return aplicarDeltaPg(next, delta);
}

/** Bonus de PG de enano/Robustez por cada nivel ganado o perdido. */
export function bonusPgPorNivelesGanados(
  character: Pick<Character, "identity" | "feats">,
  niveles: number,
): number {
  if (niveles === 0) return 0;
  const signo = niveles > 0 ? 1 : -1;
  const n = Math.abs(niveles);
  let extra = 0;
  if (esEnano(character.identity.speciesId)) extra += n;
  if (tieneDoteRobustez(character.feats)) extra += 2 * n;
  return signo * extra;
}

function pareceIntactoSinCombate(character: Character): boolean {
  return (
    character.combat.hpCurrent >= character.combat.hpMax &&
    character.combat.deathSaves.successes === 0 &&
    character.combat.deathSaves.failures === 0 &&
    character.combat.exhaustionLevel === 0
  );
}

/** Deja vida, espacios de conjuro, dados de golpe y pacto al máximo disponible. */
export function recursosCompletos(character: Character): Character {
  const pactMax = espaciosPactoMaximos(character.identity.classes);

  return {
    ...character,
    combat: {
      ...character.combat,
      hpCurrent: character.combat.hpMax,
      hpTemp: 0,
      hitDiceUsed: 0,
      hitDiceSpentByDie: {},
      hitDiceTotal: character.identity.level,
      exhaustionLevel: 0,
      deathSaves: { successes: 0, failures: 0 },
    },
    spells: {
      ...character.spells,
      spellSlotsUsed: slotsVacios(),
      pactMagicUsed: pactMax > 0 ? 0 : null,
      concentratingOn: null,
    },
    resources: character.resources.map((r) => ({ ...r, used: 0 })),
  };
}

/** Corrige datos incoherentes sin borrar el progreso de combate real. */
export function sanitizarRecursos(character: Character): Character {
  const maxSlots = espaciosMaximosPersonaje(character);
  const used = espaciosUsadosSeguros(character);
  const nivelesConEspacios = SPELL_SLOT_LEVELS.filter((level) => maxSlots[level] > 0);

  const todosEspaciosGastados =
    nivelesConEspacios.length > 0 &&
    nivelesConEspacios.every((level) => used[level] >= maxSlots[level]);

  const pareceLegacySinGastar =
    todosEspaciosGastados &&
    character.combat.hitDiceUsed === 0 &&
    character.combat.hpCurrent >= character.combat.hpMax;

  const spellSlotsUsed = pareceLegacySinGastar ? slotsVacios() : used;

  const pactMax = espaciosPactoMaximos(character.identity.classes);
  let pactMagicUsed = character.spells.pactMagicUsed ?? 0;
  if (pactMax > 0 && pactMagicUsed > pactMax) pactMagicUsed = pactMax;
  if (pareceLegacySinGastar && pactMax > 0) pactMagicUsed = 0;

  const espaciosSinGastar =
    nivelesConEspacios.length === 0 ||
    nivelesConEspacios.every((level) => spellSlotsUsed[level] === 0);

  const hitDiceTotal = Math.max(character.identity.level, character.combat.hitDiceTotal);
  let hitDiceUsed = Math.min(character.combat.hitDiceUsed, hitDiceTotal);
  const hitDiceSpentByDie = character.combat.hitDiceSpentByDie ?? {};

  if (
    pareceIntactoSinCombate(character) &&
    espaciosSinGastar &&
    hitDiceUsed >= hitDiceTotal &&
    hitDiceTotal > 0
  ) {
    hitDiceUsed = 0;
  }

  const resources = character.resources.map((r) => {
    const used = Math.min(Math.max(0, r.used), r.max);
    if (
      pareceIntactoSinCombate(character) &&
      espaciosSinGastar &&
      hitDiceUsed === 0 &&
      r.max > 0 &&
      used >= r.max
    ) {
      return { ...r, used: 0 };
    }
    return { ...r, used };
  });

  return {
    ...character,
    combat: {
      ...character.combat,
      hpCurrent: Math.min(Math.max(0, character.combat.hpCurrent), character.combat.hpMax),
      hpTemp: Math.max(0, character.combat.hpTemp),
      hitDiceTotal,
      hitDiceUsed,
      hitDiceSpentByDie,
    },
    spells: {
      ...character.spells,
      spellSlotsUsed,
      pactMagicUsed: pactMax > 0 ? pactMagicUsed : null,
    },
    resources,
  };
}

export function aplicarDefaultsRecursos(character: Character): Character {
  return sanitizarRecursos(recursosCompletos(character));
}
