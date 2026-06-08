import type { SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { tirarDadoDenominacion } from "@/rules/dice";
import { espaciosMaximos, tipoLanzador } from "@/rules/spells";
import type { Character } from "@/schemas/character";

function slotsVacios(): Character["spells"]["spellSlotsUsed"] {
  return Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, 0])) as Character["spells"]["spellSlotsUsed"];
}

/** Descanso largo SRD 2024 simplificado: PV al máximo, espacios restaurados, recuperar mitad de dados de golpe gastados. */
export function aplicarDescansoLargo(character: Character): Character {
  const recuperarDados = Math.max(1, Math.floor(character.combat.hitDiceTotal / 2));
  const hitDiceUsed = Math.max(0, character.combat.hitDiceUsed - recuperarDados);

  return {
    ...character,
    combat: {
      ...character.combat,
      hpCurrent: character.combat.hpMax,
      hitDiceUsed,
    },
    spells: {
      ...character.spells,
      spellSlotsUsed: slotsVacios(),
      pactMagicUsed: tipoLanzador(character.identity.classId) === "pact" ? 0 : character.spells.pactMagicUsed,
    },
  };
}

/** Descanso corto: brujo recupera espacios de pacto. */
export function aplicarDescansoCorto(character: Character): Character {
  if (tipoLanzador(character.identity.classId) !== "pact") {
    return character;
  }
  return {
    ...character,
    spells: {
      ...character.spells,
      spellSlotsUsed: slotsVacios(),
      pactMagicUsed: 0,
    },
  };
}

/** Gasta un dado de golpe y cura (dado + mod CON). */
export function gastarDadoGolpe(character: Character): {
  character: Character;
  curacion: number;
  tirada: number;
} | null {
  if (character.combat.hitDiceUsed >= character.combat.hitDiceTotal) return null;

  const tirada = tirarDadoDenominacion(character.combat.hitDie);
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

export function ajustarEspacioUsado(
  character: Character,
  level: SpellSlotLevel,
  delta: number,
): Character {
  const max = espaciosMaximos(character.identity.classId, character.identity.level)[level];
  const actual = character.spells.spellSlotsUsed[level];
  const next = Math.min(max, Math.max(0, actual + delta));

  return {
    ...character,
    spells: {
      ...character.spells,
      spellSlotsUsed: {
        ...character.spells.spellSlotsUsed,
        [level]: next,
      },
    },
  };
}
