import type { ConditionId } from "@/lib/conditions";
import type { Character } from "@/schemas/character";
import { aplicarAgotamientoAlRecuperarPg } from "@/rules/exhaustion";
import { registrarFalloSalvacionMuerte, resetearSalvacionesMuerte } from "@/rules/death-saves";
import { tiradaConcentracionPorDanio, type ResultadoConcentracion } from "@/rules/concentration";
import type { DiceRollOptions, RollMode } from "@/rules/dice";

export interface CambioPvOptions {
  damageType?: string;
}

function multiplicadorTipo(
  combat: Character["combat"],
  damageType: string | undefined,
  delta: number,
): number {
  if (delta >= 0 || !damageType) return 1;
  const type = damageType.toLowerCase();
  if (combat.damageImmunities.some((t) => t.toLowerCase() === type)) return 0;
  if (combat.damageVulnerabilities.some((t) => t.toLowerCase() === type)) return 2;
  if (combat.damageResistances.some((t) => t.toLowerCase() === type)) return 0.5;
  return 1;
}

function conInconsciente(combat: Character["combat"], activo: boolean): Character["combat"] {
  const ids: ConditionId[] = combat.conditionIds.filter((id) => id !== "unconscious");
  if (activo) ids.push("unconscious");
  return { ...combat, conditionIds: ids };
}

function marcarMuerto(combat: Character["combat"]): Character["combat"] {
  return conInconsciente(
    {
      ...combat,
      hpCurrent: 0,
      hpTemp: 0,
      deathSaves: { successes: 0, failures: 3 },
    },
    true,
  );
}

/** Aplica curación o daño respetando PV temporales y tipos de daño. */
export function aplicarCambioPv(
  combat: Character["combat"],
  delta: number,
  options?: CambioPvOptions,
): Character["combat"] {
  if (delta === 0) return combat;

  const factor = multiplicadorTipo(combat, options?.damageType, delta);
  const adjustedDelta =
    delta < 0 ? -Math.floor(Math.abs(delta) * factor) : Math.floor(delta * factor);

  if (adjustedDelta === 0 && delta < 0) return combat;

  if (adjustedDelta > 0) {
    const wasDown = combat.hpCurrent === 0;
    const hpCurrent = Math.min(combat.hpMax, combat.hpCurrent + adjustedDelta);
    let next = { ...combat, hpCurrent };
    if (wasDown && hpCurrent > 0) {
      next = aplicarAgotamientoAlRecuperarPg(
        resetearSalvacionesMuerte(conInconsciente(next, false)),
      );
    }
    return next;
  }

  let restante = -adjustedDelta;
  let hpTemp = combat.hpTemp;
  let hpCurrent = combat.hpCurrent;

  if (hpTemp > 0) {
    const enTemp = Math.min(hpTemp, restante);
    hpTemp -= enTemp;
    restante -= enTemp;
  }

  if (restante > 0) {
    hpCurrent = Math.max(0, hpCurrent - restante);
  }

  return { ...combat, hpTemp, hpCurrent };
}

export type ResultadoCambioPv = {
  character: Character;
  damageTaken: number;
  deathMessage?: string;
};

/** Daño o curación en ficha, con muerte instantánea y fallos de muerte. */
export function aplicarDeltaPvPersonaje(
  character: Character,
  delta: number,
  options?: CambioPvOptions,
): ResultadoCambioPv {
  if (delta === 0) return { character, damageTaken: 0 };

  const prevHp = character.combat.hpCurrent;
  const prevTemp = character.combat.hpTemp;
  const factor = multiplicadorTipo(character.combat, options?.damageType, delta);
  const adjustedDelta =
    delta < 0 ? -Math.floor(Math.abs(delta) * factor) : Math.floor(delta * factor);
  const damageAfterTemp =
    adjustedDelta < 0 ? Math.max(0, -adjustedDelta - prevTemp) : 0;

  if (adjustedDelta < 0) {
    if (prevHp > 0 && damageAfterTemp - prevHp >= character.combat.hpMax) {
      return {
        character: { ...character, combat: marcarMuerto(character.combat) },
        damageTaken: Math.abs(delta),
        deathMessage: "Muerte instantánea: el daño restante iguala o supera los PV máximos.",
      };
    }
    if (prevHp === 0 && damageAfterTemp >= character.combat.hpMax) {
      return {
        character: { ...character, combat: marcarMuerto(character.combat) },
        damageTaken: Math.abs(delta),
        deathMessage: "Muerte instantánea: el daño iguala o supera los PV máximos.",
      };
    }
  }

  const combat = aplicarCambioPv(character.combat, delta, options);
  let nextCombat = combat;
  let deathMessage: string | undefined;

  if (delta < 0 && prevHp > 0 && combat.hpCurrent === 0) {
    nextCombat = conInconsciente(combat, true);
  }

  let next: Character = { ...character, combat: nextCombat };

  if (delta < 0 && prevHp === 0 && nextCombat.hpCurrent === 0) {
    const fail = registrarFalloSalvacionMuerte(nextCombat, 1);
    next = { ...next, combat: fail.combat };
    if (fail.outcome === "dead") {
      deathMessage = "Tres fallos de salvación de muerte — personaje muerto.";
    }
  }

  return {
    character: next,
    damageTaken: delta < 0 ? Math.abs(delta) : 0,
    deathMessage,
  };
}

export type ResultadoCambioPvConcentracion = ResultadoCambioPv & {
  concentration: ResultadoConcentracion | null;
};

/** PV + tirada de concentración si el daño rompe la concentración. */
export function aplicarCambioPvConConcentracion(
  character: Character,
  delta: number,
  rollMode: RollMode,
  diceOptions?: DiceRollOptions,
  options?: CambioPvOptions,
): ResultadoCambioPvConcentracion {
  const aplicado = aplicarDeltaPvPersonaje(character, delta, options);
  let next = aplicado.character;
  let concentration: ResultadoConcentracion | null = null;
  if (aplicado.damageTaken > 0 && character.spells.concentratingOn) {
    concentration = tiradaConcentracionPorDanio(
      next,
      aplicado.damageTaken,
      rollMode,
      diceOptions,
    );
    if (concentration) next = concentration.character;
  }
  return { ...aplicado, character: next, concentration };
}
