import type { RollMode, DiceRollOptions, D20Roll } from "@/rules/dice";
import { tiradaSalvacion } from "@/rules/effects";
import { modificadorSalvacion } from "@/rules/character";
import type { Character } from "@/schemas/character";

export function cdConcentracion(damageTaken: number): number {
  return Math.max(10, Math.ceil(damageTaken / 2));
}

export type ResultadoConcentracion = {
  character: Character;
  roll: D20Roll;
  dc: number;
  maintained: boolean;
};

/** Tirada de CON para mantener concentración tras recibir daño. */
export function tiradaConcentracionPorDanio(
  character: Character,
  damageTaken: number,
  rollMode: RollMode,
  diceOptions?: DiceRollOptions,
): ResultadoConcentracion | null {
  if (!character.spells.concentratingOn || damageTaken <= 0) return null;

  const dc = cdConcentracion(damageTaken);
  const mod = modificadorSalvacion(character, "con");
  const rollResult = tiradaSalvacion(
    mod,
    "con",
    rollMode,
    character.combat.conditionIds,
    character.combat.exhaustionLevel,
    diceOptions,
  );

  if ("autoFallo" in rollResult) {
    return {
      character: {
        ...character,
        spells: { ...character.spells, concentratingOn: null },
      },
      roll: {
        mode: "normal",
        rolls: [1],
        used: 1,
        modifier: mod,
        total: 1 + mod,
        isCritical: false,
        isFumble: true,
        source: diceOptions?.source ?? "virtual",
      },
      dc,
      maintained: false,
    };
  }

  const maintained = rollResult.total >= dc;
  return {
    character: maintained
      ? character
      : { ...character, spells: { ...character.spells, concentratingOn: null } },
    roll: rollResult,
    dc,
    maintained,
  };
}
