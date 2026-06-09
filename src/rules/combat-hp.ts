import type { Character } from "@/schemas/character";
import { resetearSalvacionesMuerte } from "@/rules/death-saves";

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
    const next = { ...combat, hpCurrent };
    return wasDown && hpCurrent > 0 ? resetearSalvacionesMuerte(next) : next;
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
