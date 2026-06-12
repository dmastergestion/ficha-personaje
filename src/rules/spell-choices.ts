import type { ClassLevel } from "@/schemas/character";
import { esSubclaseArcana } from "@/rules/spell-lists";
import {
  claseLanzaConjuros,
  maxConjurosGrimorio,
  maxPreparadosClase,
  maxTrucosClase,
} from "@/rules/spell-progression";
import { clasesParaConjuros, tipoLanzador } from "@/rules/spells";

export interface SeleccionConjuros {
  cantripsKnown: string[];
  spellsKnown: string[];
  spellsPrepared: string[];
}

export interface RequisitoConjuros {
  cantrips: number;
  grimorio: number;
  preparados: number;
}

function clasesConjuro(classes: ClassLevel[]): ClassLevel[] {
  return classes.filter(
    (c) => claseLanzaConjuros(c.classId, c.level) || esSubclaseArcana(c.classId, c.subclassId),
  );
}

export function requisitosConjurosClases(classes: ClassLevel[]): RequisitoConjuros {
  let cantrips = 0;
  let grimorio = 0;
  let preparados = 0;

  for (const cl of clasesConjuro(classes)) {
    cantrips += maxTrucosClase(cl.classId, cl.level);
    preparados += maxPreparadosClase(cl.classId, cl.level);
    grimorio += maxConjurosGrimorio(cl.classId, cl.level);
  }

  return { cantrips, grimorio, preparados };
}

export function requisitosConjurosDesdeSeleccion(
  classes: ClassLevel[],
  seleccion: SeleccionConjuros,
): RequisitoConjuros {
  const max = requisitosConjurosClases(classes);
  return {
    cantrips: Math.max(0, max.cantrips - seleccion.cantripsKnown.length),
    grimorio: Math.max(0, max.grimorio - seleccion.spellsKnown.length),
    preparados: Math.max(0, max.preparados - seleccion.spellsPrepared.length),
  };
}

export function deltaRequisitosSubida(
  antes: ClassLevel[],
  despues: ClassLevel[],
): RequisitoConjuros {
  const maxAntes = requisitosConjurosClases(antes);
  const maxDespues = requisitosConjurosClases(despues);
  return {
    cantrips: Math.max(0, maxDespues.cantrips - maxAntes.cantrips),
    grimorio: Math.max(0, maxDespues.grimorio - maxAntes.grimorio),
    preparados: Math.max(0, maxDespues.preparados - maxAntes.preparados),
  };
}

export function necesitaPasoConjuros(classId: string, level: number): boolean {
  return claseLanzaConjuros(classId, level) || tipoLanzador(classId) !== "none";
}

export function seleccionConjurosCompleta(
  classes: ClassLevel[],
  seleccion: SeleccionConjuros,
): boolean {
  const pend = requisitosConjurosDesdeSeleccion(classes, seleccion);
  return pend.cantrips === 0 && pend.grimorio === 0 && pend.preparados === 0;
}

export function validarSeleccionConjuros(
  classes: ClassLevel[],
  seleccion: SeleccionConjuros,
): string | null {
  const max = requisitosConjurosClases(classes);

  if (seleccion.cantripsKnown.length > max.cantrips) {
    return `Demasiados trucos (máx. ${max.cantrips}).`;
  }
  if (seleccion.spellsKnown.length > max.grimorio) {
    return `Demasiados conjuros en el grimorio (máx. ${max.grimorio}).`;
  }
  if (seleccion.spellsPrepared.length > max.preparados) {
    return `Demasiados conjuros preparados (máx. ${max.preparados}).`;
  }

  const pend = requisitosConjurosDesdeSeleccion(classes, seleccion);
  if (pend.cantrips > 0) {
    return `Elige ${pend.cantrips} truco${pend.cantrips > 1 ? "s" : ""} más.`;
  }
  if (pend.grimorio > 0) {
    return `Añade ${pend.grimorio} conjuro${pend.grimorio > 1 ? "s" : ""} al grimorio.`;
  }
  if (pend.preparados > 0) {
    return `Elige ${pend.preparados} conjuro${pend.preparados > 1 ? "s" : ""} preparado${pend.preparados > 1 ? "s" : ""} más.`;
  }

  if (max.grimorio > 0) {
    const fuera = seleccion.spellsPrepared.filter((id) => !seleccion.spellsKnown.includes(id));
    if (fuera.length > 0) {
      return "Los conjuros preparados deben estar en tu grimorio.";
    }
  }

  const dup = (ids: string[]) => new Set(ids).size !== ids.length;
  if (dup(seleccion.cantripsKnown) || dup(seleccion.spellsKnown) || dup(seleccion.spellsPrepared)) {
    return "No puedes repetir el mismo conjuro en una lista.";
  }

  return null;
}

export function clasesParaEleccionConjuros(
  classId: string,
  subclassId: string | null,
  level: number,
): ClassLevel[] {
  return [{ classId, subclassId, level }];
}

export function seleccionDesdePersonaje(spells: {
  cantripsKnown: string[];
  spellsKnown: string[];
  spellsPrepared: string[];
}): SeleccionConjuros {
  return {
    cantripsKnown: [...spells.cantripsKnown],
    spellsKnown: [...spells.spellsKnown],
    spellsPrepared: [...spells.spellsPrepared],
  };
}

export function aplicarDeltaSeleccion(
  actual: SeleccionConjuros,
  delta: SeleccionConjuros,
): SeleccionConjuros {
  return {
    cantripsKnown: [...actual.cantripsKnown, ...delta.cantripsKnown],
    spellsKnown: [...actual.spellsKnown, ...delta.spellsKnown],
    spellsPrepared: [...actual.spellsPrepared, ...delta.spellsPrepared],
  };
}

export function validarDeltaConjuros(
  delta: RequisitoConjuros,
  seleccion: SeleccionConjuros,
  grimorioBase: string[] = [],
): string | null {
  if (seleccion.cantripsKnown.length < delta.cantrips) {
    const faltan = delta.cantrips - seleccion.cantripsKnown.length;
    return `Elige ${faltan} truco${faltan > 1 ? "s" : ""} más.`;
  }
  if (seleccion.spellsKnown.length < delta.grimorio) {
    const faltan = delta.grimorio - seleccion.spellsKnown.length;
    return `Añade ${faltan} conjuro${faltan > 1 ? "s" : ""} al grimorio.`;
  }
  if (seleccion.spellsPrepared.length < delta.preparados) {
    const faltan = delta.preparados - seleccion.spellsPrepared.length;
    return `Elige ${faltan} conjuro${faltan > 1 ? "s" : ""} preparado${faltan > 1 ? "s" : ""} más.`;
  }
  if (delta.grimorio > 0) {
    const grimorio = new Set([...grimorioBase, ...seleccion.spellsKnown]);
    const fuera = seleccion.spellsPrepared.filter((id) => !grimorio.has(id));
    if (fuera.length > 0) {
      return "Los conjuros preparados nuevos deben estar en tu grimorio.";
    }
  }
  const dup = (ids: string[]) => new Set(ids).size !== ids.length;
  if (dup(seleccion.cantripsKnown) || dup(seleccion.spellsKnown) || dup(seleccion.spellsPrepared)) {
    return "No puedes repetir el mismo conjuro en una lista.";
  }
  return null;
}

export function requisitosPendientesPersonaje(character: {
  identity: { classes: ClassLevel[]; classId: string; subclassId: string | null; level: number };
  spells: SeleccionConjuros;
}): RequisitoConjuros {
  const classes = clasesParaConjuros(character as Parameters<typeof clasesParaConjuros>[0]);
  return requisitosConjurosDesdeSeleccion(classes, character.spells);
}
