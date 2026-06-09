import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { espaciosUsadosSeguros } from "@/rules/rests";
import { espaciosMaximosPersonaje, espaciosPactoMaximos } from "@/rules/spells";
import type { Character } from "@/schemas/character";

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
