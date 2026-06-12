import {
  gastadosPorDado,
  poolDadosGolpe,
  recuperarDadosDescansoLargo,
  sincronizarGastosDados,
} from "@/rules/hit-dice";
import type { SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { tirarDadoDenominacion } from "@/rules/dice";
import { aplicarRecargaRecursos } from "@/rules/resources-tracker";
import { aplicarInspiracionHeroicaTrasDescanso } from "@/rules/heroic-inspiration";
import { espaciosMaximosPersonaje, espaciosPactoMaximos, nivelBrujo } from "@/rules/spells";
import type { Character } from "@/schemas/character";

function slotsVacios(): Character["spells"]["spellSlotsUsed"] {
  return Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, 0])) as Character["spells"]["spellSlotsUsed"];
}

export function espaciosUsadosSeguros(
  character: Character,
): Character["spells"]["spellSlotsUsed"] {
  const max = espaciosMaximosPersonaje(character);
  return Object.fromEntries(
    SPELL_SLOT_LEVELS.map((level) => {
      const raw = character.spells.spellSlotsUsed[level];
      const used = Number(raw);
      const safe = Number.isFinite(used) ? used : 0;
      return [level, Math.min(max[level], Math.max(0, safe))];
    }),
  ) as Character["spells"]["spellSlotsUsed"];
}

/** Descanso largo SRD 2024 simplificado: PV al máximo, espacios restaurados, recuperar mitad de dados de golpe gastados. */
export function aplicarDescansoLargo(character: Character): Character {
  const recuperarDados = Math.max(1, Math.floor(character.combat.hitDiceTotal / 2));
  const spentByDie = recuperarDadosDescansoLargo(gastadosPorDado(character), recuperarDados);
  const synced = sincronizarGastosDados(spentByDie, character.combat.hitDiceTotal);

  const rested = aplicarRecargaRecursos(character, "long");
  const withInspiration = aplicarInspiracionHeroicaTrasDescanso(rested, "long");
  return {
    ...withInspiration,
    combat: {
      ...withInspiration.combat,
      hpCurrent: rested.combat.hpMax,
      hpTemp: 0,
      hitDiceUsed: synced.hitDiceUsed,
      hitDiceSpentByDie: synced.hitDiceSpentByDie,
      exhaustionLevel: Math.max(0, rested.combat.exhaustionLevel - 1),
      deathSaves: { successes: 0, failures: 0 },
    },
    spells: {
      ...rested.spells,
      spellSlotsUsed: slotsVacios(),
      pactMagicUsed: nivelBrujo(character.identity.classes) > 0 ? 0 : character.spells.pactMagicUsed,
      concentratingOn: null,
    },
  };
}

/** Descanso corto: el brujo recupera sus espacios de pacto (los espacios normales NO se recuperan). */
export function aplicarDescansoCorto(character: Character): Character {
  let next = aplicarRecargaRecursos(character, "short");
  next = aplicarInspiracionHeroicaTrasDescanso(next, "short");
  if (nivelBrujo(character.identity.classes) > 0) {
    next = {
      ...next,
      spells: { ...next.spells, pactMagicUsed: 0 },
    };
  }
  return next;
}

/** Gasta un dado de golpe y cura (dado + mod CON) durante un descanso corto. */
export function gastarDadoGolpe(
  character: Character,
  die?: string,
): {
  character: Character;
  curacion: number;
  tirada: number;
  conMod: number;
} | null {
  const pool = poolDadosGolpe(character);
  const dieToUse =
    die ??
    pool.find((row) => row.disponibles > 0)?.die ??
    character.combat.hitDie;
  const row = pool.find((r) => r.die === dieToUse);
  if (!row || row.disponibles <= 0) return null;

  const tirada = tirarDadoDenominacion(dieToUse);
  const conMod = modificadorAtributo(character.abilities.con);
  const curacion = Math.max(0, tirada + conMod);
  const hpCurrent = Math.min(character.combat.hpMax, character.combat.hpCurrent + curacion);

  const spentByDie = { ...gastadosPorDado(character), [dieToUse]: (gastadosPorDado(character)[dieToUse] ?? 0) + 1 };
  const synced = sincronizarGastosDados(spentByDie, character.combat.hitDiceTotal);

  return {
    character: {
      ...character,
      combat: {
        ...character.combat,
        hpCurrent,
        hitDiceUsed: synced.hitDiceUsed,
        hitDiceSpentByDie: synced.hitDiceSpentByDie,
      },
    },
    curacion,
    tirada,
    conMod,
  };
}

export function espaciosRestantesPersonaje(
  character: Character,
): Record<SpellSlotLevel, number> {
  const max = espaciosMaximosPersonaje(character);
  const used = espaciosUsadosSeguros(character);
  return Object.fromEntries(
    SPELL_SLOT_LEVELS.map((level) => [level, Math.max(0, max[level] - used[level])]),
  ) as Record<SpellSlotLevel, number>;
}

/** deltaRestantes: −1 gasta un espacio, +1 lo recupera. */
export function ajustarEspaciosRestantes(
  character: Character,
  level: SpellSlotLevel,
  deltaRestantes: number,
): Character {
  return ajustarEspacioUsado(character, level, -deltaRestantes);
}

export function pactoRestante(character: Character): number {
  const max = espaciosPactoMaximos(
    character.identity.classes?.length
      ? character.identity.classes
      : [
          {
            classId: character.identity.classId,
            subclassId: character.identity.subclassId,
            level: character.identity.level,
          },
        ],
  );
  const used = Number.isFinite(Number(character.spells.pactMagicUsed ?? 0))
    ? Number(character.spells.pactMagicUsed ?? 0)
    : 0;
  return Math.max(0, max - used);
}

export function ajustarPactoRestante(character: Character, deltaRestantes: number): Character {
  return ajustarPactoUsado(character, -deltaRestantes);
}

export function ajustarEspacioUsado(
  character: Character,
  level: SpellSlotLevel,
  delta: number,
): Character {
  const max = espaciosMaximosPersonaje(character)[level];
  const slots = espaciosUsadosSeguros(character);
  const actual = slots[level];
  const next = Math.min(max, Math.max(0, actual + delta));

  return {
    ...character,
    spells: {
      ...character.spells,
      spellSlotsUsed: {
        ...slots,
        [level]: next,
      },
    },
  };
}

export function ajustarPactoUsado(character: Character, delta: number): Character {
  const max = espaciosPactoMaximos(
    character.identity.classes?.length
      ? character.identity.classes
      : [
          {
            classId: character.identity.classId,
            subclassId: character.identity.subclassId,
            level: character.identity.level,
          },
        ],
  );
  if (max === 0) return character;
  const raw = character.spells.pactMagicUsed ?? 0;
  const actual = Number.isFinite(Number(raw)) ? Number(raw) : 0;
  const next = Math.min(max, Math.max(0, actual + delta));
  return {
    ...character,
    spells: { ...character.spells, pactMagicUsed: next },
  };
}
