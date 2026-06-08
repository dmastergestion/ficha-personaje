import type { AbilityKey } from "@/lib/constants";
import type { ConditionId } from "@/lib/conditions";
import type { RollMode, D20Roll } from "@/rules/dice";
import { tirarD20 } from "@/rules/dice";

export interface ModificadoresCondicion {
  ventajaAtaques: boolean;
  desventajaAtaques: boolean;
  ventajaPericias: boolean;
  desventajaPericias: boolean;
  ventajaSalvaciones: boolean;
  desventajaSalvaciones: boolean;
  salvacionAutoFallo: Set<AbilityKey>;
  velocidadCero: boolean;
  multiplicadorVelocidad: number;
}

const CONDICION_REGLAS: Record<
  ConditionId,
  Partial<Omit<ModificadoresCondicion, "salvacionAutoFallo">> & {
    salvacionAutoFallo?: AbilityKey[];
  }
> = {
  blinded: { desventajaAtaques: true },
  charmed: {},
  deafened: {},
  frightened: { desventajaAtaques: true, desventajaPericias: true },
  grappled: { velocidadCero: true },
  incapacitated: {},
  invisible: { ventajaAtaques: true },
  paralyzed: { salvacionAutoFallo: ["str", "dex"] },
  petrified: { salvacionAutoFallo: ["str", "dex"] },
  poisoned: { desventajaAtaques: true, desventajaPericias: true },
  prone: { desventajaAtaques: true },
  restrained: {
    velocidadCero: true,
    desventajaAtaques: true,
    desventajaSalvaciones: true,
  },
  stunned: { salvacionAutoFallo: ["str", "dex"] },
  unconscious: { salvacionAutoFallo: ["str", "dex"] },
};

function agregarExhaustion(
  mods: ModificadoresCondicion,
  level: number,
): ModificadoresCondicion {
  if (level <= 0) return mods;

  const next = { ...mods, salvacionAutoFallo: new Set(mods.salvacionAutoFallo) };

  if (level >= 1) next.desventajaPericias = true;
  if (level >= 2) next.multiplicadorVelocidad = Math.min(next.multiplicadorVelocidad, 0.5);
  if (level >= 3) {
    next.desventajaAtaques = true;
    next.desventajaSalvaciones = true;
  }
  if (level >= 5) next.velocidadCero = true;

  return next;
}

export function calcularModificadoresCondiciones(
  conditionIds: ConditionId[],
  exhaustionLevel = 0,
): ModificadoresCondicion {
  const mods: ModificadoresCondicion = {
    ventajaAtaques: false,
    desventajaAtaques: false,
    ventajaPericias: false,
    desventajaPericias: false,
    ventajaSalvaciones: false,
    desventajaSalvaciones: false,
    salvacionAutoFallo: new Set(),
    velocidadCero: false,
    multiplicadorVelocidad: 1,
  };

  for (const id of conditionIds) {
    const regla = CONDICION_REGLAS[id];
    if (regla.ventajaAtaques) mods.ventajaAtaques = true;
    if (regla.desventajaAtaques) mods.desventajaAtaques = true;
    if (regla.ventajaPericias) mods.ventajaPericias = true;
    if (regla.desventajaPericias) mods.desventajaPericias = true;
    if (regla.ventajaSalvaciones) mods.ventajaSalvaciones = true;
    if (regla.desventajaSalvaciones) mods.desventajaSalvaciones = true;
    if (regla.velocidadCero) mods.velocidadCero = true;
    if (regla.multiplicadorVelocidad !== undefined) {
      mods.multiplicadorVelocidad = Math.min(
        mods.multiplicadorVelocidad,
        regla.multiplicadorVelocidad,
      );
    }
    for (const key of regla.salvacionAutoFallo ?? []) {
      mods.salvacionAutoFallo.add(key);
    }
  }

  return agregarExhaustion(mods, exhaustionLevel);
}

export function resolverModoTirada(
  elegido: RollMode,
  ventajaExtra: boolean,
  desventajaExtra: boolean,
): RollMode {
  const ventaja = elegido === "advantage" || ventajaExtra;
  const desventaja = elegido === "disadvantage" || desventajaExtra;
  if (ventaja && desventaja) return "normal";
  if (ventaja) return "advantage";
  if (desventaja) return "disadvantage";
  return elegido === "normal" ? "normal" : elegido;
}

export type ResultadoTirada = D20Roll | { autoFallo: true; razon: string };

export function tiradaSalvacion(
  modificador: number,
  ability: AbilityKey,
  modoElegido: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
): ResultadoTirada {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  if (mods.salvacionAutoFallo.has(ability)) {
    return { autoFallo: true, razon: "Autofallo por condición" };
  }
  const mode = resolverModoTirada(
    modoElegido,
    mods.ventajaSalvaciones,
    mods.desventajaSalvaciones,
  );
  return tirarD20(modificador, mode);
}

export function tiradaPericia(
  modificador: number,
  modoElegido: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
): D20Roll {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  const mode = resolverModoTirada(
    modoElegido,
    mods.ventajaPericias,
    mods.desventajaPericias,
  );
  return tirarD20(modificador, mode);
}

export function tiradaAtaque(
  modificador: number,
  modoElegido: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
): D20Roll {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  const mode = resolverModoTirada(
    modoElegido,
    mods.ventajaAtaques,
    mods.desventajaAtaques,
  );
  return tirarD20(modificador, mode);
}

export function resumenEfectosActivos(
  conditionIds: ConditionId[],
  exhaustionLevel: number,
): string[] {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  const lineas: string[] = [];

  if (mods.ventajaAtaques) lineas.push("Ventaja en ataques");
  if (mods.desventajaAtaques) lineas.push("Desventaja en ataques");
  if (mods.desventajaPericias) lineas.push("Desventaja en pruebas de característica");
  if (mods.desventajaSalvaciones) lineas.push("Desventaja en salvaciones");
  if (mods.salvacionAutoFallo.size > 0) {
    lineas.push(`Autofallo salvaciones: ${[...mods.salvacionAutoFallo].join(", ")}`);
  }
  if (mods.velocidadCero) lineas.push("Velocidad 0");
  else if (mods.multiplicadorVelocidad < 1) lineas.push("Velocidad reducida");
  if (exhaustionLevel > 0) lineas.push(`Agotamiento nivel ${exhaustionLevel}`);

  return lineas;
}
