import type { AbilityKey } from "@/lib/constants";
import type { ConditionId } from "@/lib/conditions";
import type { RollMode, D20Roll, DiceRollOptions } from "@/rules/dice";
import { construirTiradaD20 } from "@/rules/dice";
import { penalizacionAgotamiento, reduccionVelocidadAgotamiento } from "@/rules/edition";
import type { Character } from "@/schemas/character";

export interface ModificadoresCondicion {
  ventajaAtaques: boolean;
  desventajaAtaques: boolean;
  desventajaPericias: boolean;
  desventajaSalvaciones: boolean;
  salvacionAutoFallo: Set<AbilityKey>;
  salvacionDesventaja: Set<AbilityKey>;
  velocidadCero: boolean;
  multiplicadorVelocidad: number;
  rompeConcentracion: boolean;
  notas: string[];
}

type ReglaCondicion = Partial<
  Omit<
    ModificadoresCondicion,
    "salvacionAutoFallo" | "salvacionDesventaja" | "notas" | "rompeConcentracion"
  >
> & {
  salvacionAutoFallo?: AbilityKey[];
  salvacionDesventaja?: AbilityKey[];
  rompeConcentracion?: boolean;
  desventajaD20?: boolean;
  notas?: string[];
};

const CONDICION_REGLAS: Record<ConditionId, ReglaCondicion> = {
  blinded: {
    desventajaAtaques: true,
    notas: ["Fallas pruebas que requieran ver", "Ataques contra ti: ventaja"],
  },
  charmed: {
    notas: ["No puedes atacar a quien te hechizó ni elegirla como objetivo de efecto dañino"],
  },
  deafened: {
    notas: ["Fallas pruebas que requieran oír"],
  },
  frightened: {
    desventajaAtaques: true,
    desventajaPericias: true,
    notas: ["Mientras veas la fuente del miedo: no puedes acercarte a ella"],
  },
  grappled: { velocidadCero: true },
  incapacitated: {
    rompeConcentracion: true,
    notas: ["Sin acciones, acción adicional ni reacción", "Se acaba la concentración"],
  },
  invisible: {
    ventajaAtaques: true,
    notas: ["Ataques contra ti: desventaja si no te ven"],
  },
  paralyzed: {
    rompeConcentracion: true,
    salvacionAutoFallo: ["str", "dex"],
    notas: [
      "Incapacitado (sin acciones; se acaba la concentración)",
      "Ataques contra ti: ventaja; cuerpo a cuerpo a 5 pies: crítico",
    ],
  },
  petrified: {
    rompeConcentracion: true,
    salvacionAutoFallo: ["str", "dex"],
    notas: ["Incapacitado (sin acciones; se acaba la concentración)"],
  },
  poisoned: {
    desventajaD20: true,
    notas: ["Desventaja en pruebas d20 (ataques, características y salvaciones)"],
  },
  prone: {
    desventajaAtaques: true,
    notas: ["Ataques contra ti a ≤5 pies: ventaja; más lejos: desventaja"],
  },
  restrained: {
    velocidadCero: true,
    desventajaAtaques: true,
    salvacionDesventaja: ["dex"],
    notas: ["Ataques contra ti: ventaja", "Desventaja en salvaciones de Destreza"],
  },
  stunned: {
    rompeConcentracion: true,
    salvacionAutoFallo: ["str", "dex"],
    notas: ["Incapacitado (sin acciones; se acaba la concentración)", "Ataques contra ti: ventaja"],
  },
  unconscious: {
    rompeConcentracion: true,
    salvacionAutoFallo: ["str", "dex"],
    notas: [
      "Incapacitado y tumbado (se acaba la concentración)",
      "Ataques contra ti: ventaja; cuerpo a cuerpo a 5 pies: crítico",
    ],
  },
};

export function calcularModificadoresCondiciones(
  conditionIds: ConditionId[],
  _exhaustionLevel = 0,
): ModificadoresCondicion {
  const mods: ModificadoresCondicion = {
    ventajaAtaques: false,
    desventajaAtaques: false,
    desventajaPericias: false,
    desventajaSalvaciones: false,
    salvacionAutoFallo: new Set(),
    salvacionDesventaja: new Set(),
    velocidadCero: false,
    multiplicadorVelocidad: 1,
    rompeConcentracion: false,
    notas: [],
  };

  for (const id of conditionIds) {
    const regla = CONDICION_REGLAS[id];
    if (regla.ventajaAtaques) mods.ventajaAtaques = true;
    if (regla.desventajaAtaques || regla.desventajaD20) mods.desventajaAtaques = true;
    if (regla.desventajaPericias || regla.desventajaD20) mods.desventajaPericias = true;
    if (regla.desventajaSalvaciones || regla.desventajaD20) mods.desventajaSalvaciones = true;
    if (regla.velocidadCero) mods.velocidadCero = true;
    if (regla.rompeConcentracion) mods.rompeConcentracion = true;
    if (regla.multiplicadorVelocidad !== undefined) {
      mods.multiplicadorVelocidad = Math.min(
        mods.multiplicadorVelocidad,
        regla.multiplicadorVelocidad,
      );
    }
    for (const key of regla.salvacionAutoFallo ?? []) {
      mods.salvacionAutoFallo.add(key);
    }
    for (const key of regla.salvacionDesventaja ?? []) {
      mods.salvacionDesventaja.add(key);
    }
    for (const nota of regla.notas ?? []) {
      if (!mods.notas.includes(nota)) mods.notas.push(nota);
    }
  }

  return mods;
}

export function condicionRompeConcentracion(conditionIds: ConditionId[]): boolean {
  return calcularModificadoresCondiciones(conditionIds).rompeConcentracion;
}

/** Aplica el set de condiciones; si alguna impide concentrar, corta el conjuro. */
export function aplicarCondicionesPersonaje(
  character: Character,
  conditionIds: ConditionId[],
): Character {
  const unique = [...new Set(conditionIds)];
  const next: Character = {
    ...character,
    combat: { ...character.combat, conditionIds: unique },
  };
  if (!condicionRompeConcentracion(unique) || !next.spells.concentratingOn) return next;
  return { ...next, spells: { ...next.spells, concentratingOn: null } };
}

function d20ConAgotamiento(
  modificador: number,
  mode: RollMode,
  exhaustionLevel: number,
  diceOptions?: DiceRollOptions,
) {
  return construirTiradaD20(
    modificador + penalizacionAgotamiento(exhaustionLevel),
    mode,
    diceOptions,
  );
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
  diceOptions?: DiceRollOptions,
  extra?: { ventaja?: boolean; desventaja?: boolean },
): ResultadoTirada {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  if (mods.salvacionAutoFallo.has(ability)) {
    return { autoFallo: true, razon: "Autofallo por condición" };
  }
  const mode = resolverModoTirada(
    modoElegido,
    extra?.ventaja ?? false,
    mods.desventajaSalvaciones ||
      mods.salvacionDesventaja.has(ability) ||
      (extra?.desventaja ?? false),
  );
  const result = d20ConAgotamiento(modificador, mode, exhaustionLevel, diceOptions);
  if (!result.ok) return { autoFallo: true, razon: result.error };
  return result.roll;
}

export function tiradaPericia(
  modificador: number,
  modoElegido: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
  diceOptions?: DiceRollOptions,
  extra?: { ventaja?: boolean; desventaja?: boolean },
): D20Roll | { error: string } {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  const mode = resolverModoTirada(
    modoElegido,
    extra?.ventaja ?? false,
    mods.desventajaPericias || (extra?.desventaja ?? false),
  );
  const result = d20ConAgotamiento(modificador, mode, exhaustionLevel, diceOptions);
  if (!result.ok) return { error: result.error };
  return result.roll;
}

export function tiradaAtaque(
  modificador: number,
  modoElegido: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
  diceOptions?: DiceRollOptions,
  extra?: { ventaja?: boolean; desventaja?: boolean },
): D20Roll | { error: string } {
  const mods = calcularModificadoresCondiciones(conditionIds, exhaustionLevel);
  const mode = resolverModoTirada(
    modoElegido,
    mods.ventajaAtaques || (extra?.ventaja ?? false),
    mods.desventajaAtaques || (extra?.desventaja ?? false),
  );
  const result = d20ConAgotamiento(modificador, mode, exhaustionLevel, diceOptions);
  if (!result.ok) return { error: result.error };
  return result.roll;
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
  if (mods.salvacionDesventaja.size > 0) {
    lineas.push(
      `Desventaja en salvaciones: ${[...mods.salvacionDesventaja].join(", ")}`,
    );
  }
  if (mods.velocidadCero) lineas.push("Velocidad 0");
  else if (mods.multiplicadorVelocidad < 1) lineas.push("Velocidad reducida");
  lineas.push(...mods.notas);
  if (exhaustionLevel > 0) {
    const penal = penalizacionAgotamiento(exhaustionLevel);
    const pies = reduccionVelocidadAgotamiento(exhaustionLevel);
    lineas.push(`Agotamiento ${exhaustionLevel} (${penal} a d20, −${pies} pies)`);
  }

  return lineas;
}
