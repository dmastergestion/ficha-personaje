import type { ConditionId } from "@/lib/conditions";
import type { Character } from "@/schemas/character";
import { aplicarAgotamientoAlRecuperarPg } from "@/rules/exhaustion";
import { registrarFalloSalvacionMuerte, resetearSalvacionesMuerte } from "@/rules/death-saves";
import { tiradaConcentracionPorDanio, type ResultadoConcentracion } from "@/rules/concentration";
import type { DiceRollOptions, RollMode } from "@/rules/dice";
import {
  listaIncluyeTipoDano,
  normalizarTipoDano,
  resistenciasDerivadasPersonaje,
} from "@/rules/damage-resistances";
import { BEAR_RAGE_EXCEPT, opcionRabiaCorazonSalvaje } from "@/rules/wild-heart";

export interface CambioPvOptions {
  damageType?: string;
  /** Rabia de Oso: resistir todo excepto fuerza/necrótico/psíquico/radiante. */
  bearRage?: boolean;
  /** Resistencias derivadas (especie, objetos). No persistir. */
  extraResistances?: string[];
}

const DANIO_FISICO = new Set(["contundente", "cortante", "perforante"]);

function multiplicadorTipo(
  combat: Character["combat"],
  damageType: string | undefined,
  delta: number,
  options?: CambioPvOptions,
): number {
  if (delta >= 0 || !damageType) return 1;
  const type = normalizarTipoDano(damageType);
  if (listaIncluyeTipoDano(combat.damageImmunities, type)) return 0;
  const rabiaOso = Boolean(options?.bearRage && combat.raging);
  const resistencias = [
    ...combat.damageResistances,
    ...(options?.extraResistances ?? []),
  ];
  const resistente =
    listaIncluyeTipoDano(resistencias, type) ||
    (rabiaOso && !BEAR_RAGE_EXCEPT.has(type)) ||
    (combat.raging && !rabiaOso && DANIO_FISICO.has(type));
  const vulnerable = listaIncluyeTipoDano(combat.damageVulnerabilities, type);
  if (vulnerable && resistente) return 1;
  if (vulnerable) return 2;
  if (resistente) return 0.5;
  return 1;
}

function opcionesPvPersonaje(character: Character, extra?: CambioPvOptions): CambioPvOptions {
  const derivadas = resistenciasDerivadasPersonaje(character);
  const extraResistances = [...derivadas];
  for (const tipo of extra?.extraResistances ?? []) {
    if (!listaIncluyeTipoDano(extraResistances, tipo)) extraResistances.push(tipo);
  }
  return {
    ...extra,
    bearRage: extra?.bearRage ?? opcionRabiaCorazonSalvaje(character) === "bear",
    extraResistances,
  };
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

  const factor = multiplicadorTipo(combat, options?.damageType, delta, options);
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
  warning?: string;
};

export const AVISO_DANIO_SIN_TIPO_RABIA =
  "Elige el tipo de daño: la rabia resiste según el tipo.";

/** Con rabia activa el tipo importa; no aplicar daño sin tipo. */
export function danoRequiereTipo(
  character: Character,
  delta: number,
  damageType?: string,
): boolean {
  return delta < 0 && !damageType && Boolean(character.combat.raging);
}

/** Daño o curación en ficha, con muerte instantánea y fallos de muerte. */
export function aplicarDeltaPvPersonaje(
  character: Character,
  delta: number,
  options?: CambioPvOptions,
): ResultadoCambioPv {
  if (delta === 0) return { character, damageTaken: 0 };

  const opts = opcionesPvPersonaje(character, options);
  if (danoRequiereTipo(character, delta, opts.damageType)) {
    return {
      character,
      damageTaken: 0,
      warning: AVISO_DANIO_SIN_TIPO_RABIA,
    };
  }
  const prevHp = character.combat.hpCurrent;
  const prevTemp = character.combat.hpTemp;
  const factor = multiplicadorTipo(character.combat, opts.damageType, delta, opts);
  const adjustedDelta =
    delta < 0 ? -Math.floor(Math.abs(delta) * factor) : Math.floor(delta * factor);
  const damageAfterTemp =
    adjustedDelta < 0 ? Math.max(0, -adjustedDelta - prevTemp) : 0;

  if (adjustedDelta < 0) {
    if (prevHp > 0 && damageAfterTemp - prevHp >= character.combat.hpMax) {
      return {
        character: { ...character, combat: marcarMuerto(character.combat) },
        damageTaken: Math.abs(adjustedDelta),
        deathMessage: "Muerte instantánea: el daño restante iguala o supera los PV máximos.",
      };
    }
    if (prevHp === 0 && damageAfterTemp >= character.combat.hpMax) {
      return {
        character: { ...character, combat: marcarMuerto(character.combat) },
        damageTaken: Math.abs(adjustedDelta),
        deathMessage: "Muerte instantánea: el daño iguala o supera los PV máximos.",
      };
    }
  }

  const combat = aplicarCambioPv(character.combat, delta, opts);
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
    damageTaken: adjustedDelta < 0 ? Math.abs(adjustedDelta) : 0,
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
  const aplicado = aplicarDeltaPvPersonaje(character, delta, opcionesPvPersonaje(character, options));
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
