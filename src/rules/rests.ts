import type { SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { tirarDadoDenominacion } from "@/rules/dice";
import { aplicarRecargaRecursos } from "@/rules/resources-tracker";
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
  const hitDiceUsed = Math.max(0, character.combat.hitDiceUsed - recuperarDados);

  const rested = aplicarRecargaRecursos(character, "long");
  return {
    ...rested,
    combat: {
      ...rested.combat,
      hpCurrent: rested.combat.hpMax,
      hpTemp: 0,
      hitDiceUsed,
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
  if (nivelBrujo(character.identity.classes) > 0) {
    next = {
      ...next,
      spells: { ...next.spells, pactMagicUsed: 0 },
    };
  }
  return next;
}

/** Gasta un dado de golpe y cura (dado + mod CON). Permite elegir el dado en multiclase. */
export function gastarDadoGolpe(
  character: Character,
  die?: string,
): {
  character: Character;
  curacion: number;
  tirada: number;
} | null {
  if (character.combat.hitDiceUsed >= character.combat.hitDiceTotal) return null;

  const tirada = tirarDadoDenominacion(die ?? character.combat.hitDie);
  const curacion = Math.max(1, tirada + modificadorAtributo(character.abilities.con));
  const hpCurrent = Math.min(
    character.combat.hpMax,
    character.combat.hpCurrent + curacion,
  );

  return {
    character: {
      ...character,
      combat: {
        ...character.combat,
        hpCurrent,
        hitDiceUsed: character.combat.hitDiceUsed + 1,
      },
    },
    curacion,
    tirada,
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
