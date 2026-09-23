import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { ABILITY_LABELS_ES } from "@/rules/character";
import {
  cantidadExpertiseHastaNivel,
  cantidadMejorasAtributosHastaNivel,
  nivelSubclase,
} from "@/rules/class-features";
import { eleccionClaseCompleta } from "@/rules/class-equipment";
import {
  asignarArrayEstandarManual,
  asignarTiradas4d6,
  PRESUPUESTO_POINT_BUY,
  puntosGastadosPointBuy,
  type DatosAsistente,
  type MejoraCreacion,
} from "@/rules/creation";
import type { Tirada4d6 } from "@/rules/dice";
import { claseConcedeEstiloCombate, doteConfigCompleta, eleccionesDote } from "@/rules/feat-mechanics";
import { nombreDote } from "@/rules/feat-text";
import {
  bonificacionAtributosCompleta,
  eleccionesOrigenCompletas,
  type OriginChoices,
} from "@/rules/origin-choices";
import {
  calcularBeneficiosOrigen,
  type OrigenCatalogo,
} from "@/rules/origin-benefits";
import { periciasClaseCompletas, periciasClaseDesdeElecciones } from "@/rules/class-skills";

export function clampIndicePaso(paso: number, totalPasos: number): number {
  if (totalPasos <= 0) return 0;
  return Math.min(Math.max(0, paso), totalPasos - 1);
}

export function mejorasCreacionVacias(n: number, prev: MejoraCreacion[] = []): MejoraCreacion[] {
  return Array.from({ length: n }, (_, i) => prev[i] ?? {
    modo: "asi",
    asiDos: false,
    asiA: "str",
    asiB: "dex",
  });
}

export function textoMejoraCreacion(mejora: MejoraCreacion): string {
  if (mejora.modo === "feat") {
    return mejora.featId ? `Dote: ${nombreDote(mejora.featId)}` : "Dote (sin elegir)";
  }
  if (mejora.asiDos) {
    return `ASI +1 ${ABILITY_LABELS_ES[mejora.asiA]} y +1 ${ABILITY_LABELS_ES[mejora.asiB]}`;
  }
  return `ASI +2 ${ABILITY_LABELS_ES[mejora.asiA]}`;
}

export function validarAsignacionAtributos(opts: {
  modo: "sinElegir" | "4d6" | "array" | "pointBuy";
  abilities: Record<AbilityKey, number>;
  tiradas4d6: Tirada4d6[] | null;
  asignacion4d6: Partial<Record<AbilityKey, number>>;
  asignacionArray: Partial<Record<AbilityKey, number>>;
}): string | null {
  if (opts.modo === "sinElegir") {
    return "Elige cómo obtienes los atributos: 4d6, array estándar o compra de puntos.";
  }
  if (opts.modo === "4d6") {
    if (!opts.tiradas4d6 || asignarTiradas4d6(opts.tiradas4d6, opts.asignacion4d6) == null) {
      return "Asigna las seis tiradas de 4d6 a los atributos.";
    }
  }
  if (opts.modo === "array" && asignarArrayEstandarManual(opts.asignacionArray) == null) {
    return "Asigna los seis valores del array estándar (15, 14, 13, 12, 10, 8).";
  }
  if (opts.modo === "pointBuy" && puntosGastadosPointBuy(opts.abilities) !== PRESUPUESTO_POINT_BUY) {
    return `La compra de puntos debe gastar exactamente ${PRESUPUESTO_POINT_BUY} puntos.`;
  }
  return null;
}

export function validarMejorasCreacion(mejoras: MejoraCreacion[], necesarias: number): string | null {
  if (necesarias <= 0) return null;
  if (mejoras.length < necesarias) {
    return `Elige ASI o dote en cada mejora de nivel (${necesarias}).`;
  }
  for (let i = 0; i < necesarias; i++) {
    const m = mejoras[i];
    if (!m) return `Falta la mejora de atributos nº ${i + 1}.`;
    if (m.modo === "feat" && !m.featId) {
      return `Elige una dote para la mejora nº ${i + 1}, o usa ASI.`;
    }
    if (m.modo === "asi" && m.asiDos && m.asiA === m.asiB) {
      return `En la mejora nº ${i + 1}, el +1 debe ir a dos atributos distintos.`;
    }
  }
  return null;
}

export function validarExpertiseCreacion(
  classId: string | null,
  level: number,
  expertise: SkillKey[] | undefined,
): string | null {
  const n = cantidadExpertiseHastaNivel(classId, level);
  if (n <= 0) return null;
  const chosen = expertise ?? [];
  if (chosen.length < n) {
    return `Elige ${n} pericias con expertise (pícaro 1 / bardo 2).`;
  }
  return null;
}

export function validarEstiloCombateCreacion(
  classId: string | null,
  level: number,
  fightingStyleFeatId: string | null | undefined,
): string | null {
  if (!classId || !claseConcedeEstiloCombate(classId, level)) return null;
  if (!fightingStyleFeatId) {
    return "Elige un estilo de combate (dote de estilo).";
  }
  return null;
}

export function validarDotesOrigenCreacion(
  datos: DatosAsistente,
  originChoices: OriginChoices,
  catalogo?: OrigenCatalogo,
  opts?: { incluirPericiasClase?: boolean },
): string | null {
  const origen = calcularBeneficiosOrigen(
    datos.speciesId,
    datos.backgroundId,
    datos.level,
    catalogo,
    originChoices,
  );
  const ocupadas = [
    ...origen.skills,
    ...(opts?.incluirPericiasClase
      ? periciasClaseDesdeElecciones(datos.classId, originChoices.class)
      : []),
  ];
  const feats = [origen.speciesFeat, origen.feat].filter(Boolean) as NonNullable<
    typeof origen.feat
  >[];
  for (const feat of feats) {
    const merged = {
      ...feat,
      choices: { ...feat.choices, ...datos.featChoices?.[feat.id] },
    };
    if (eleccionesDote(merged, [], { occupiedSkills: ocupadas }).length === 0) continue;
    if (!doteConfigCompleta(merged, { skills: ocupadas })) {
      return `Completa las elecciones de la dote de origen (${nombreDote(feat.id)}).`;
    }
  }
  return null;
}

export function validarPasoAsistente(
  stepId: "identidad" | "origen" | "clase" | "atributos" | "conjuros" | "resumen",
  datos: DatosAsistente,
  extras: {
    originChoices: OriginChoices;
    catalogoOrigen?: OrigenCatalogo;
    modoAtributos: "sinElegir" | "4d6" | "array" | "pointBuy";
    tiradas4d6: Tirada4d6[] | null;
    asignacion4d6: Partial<Record<AbilityKey, number>>;
    asignacionArray: Partial<Record<AbilityKey, number>>;
    periciasClaseOk: boolean;
    faltaClase: string | null;
    maestriasOk: boolean;
    conjurosMsg: string | null;
    conjurosClaseMsg: string | null;
  },
): string | null {
  if (stepId === "identidad" && !datos.name.trim()) {
    return "El nombre del personaje es obligatorio.";
  }
  if (stepId === "origen" && !datos.backgroundId) return "Elige un trasfondo.";
  if (stepId === "origen" && !datos.speciesId) return "Elige una especie.";
  if (
    stepId === "origen" &&
    !eleccionesOrigenCompletas(
      datos.speciesId,
      datos.backgroundId,
      extras.originChoices,
      extras.catalogoOrigen,
      { incluirAtributosTrasfondo: false },
    )
  ) {
    return "Completa las elecciones de especie y trasfondo.";
  }
  if (stepId === "origen") {
    const dotesOrigen = validarDotesOrigenCreacion(datos, extras.originChoices, extras.catalogoOrigen);
    if (dotesOrigen) return dotesOrigen;
    if (!extras.periciasClaseOk) return "Elige las pericias de clase.";
    const skillsOrigen = calcularBeneficiosOrigen(
      datos.speciesId,
      datos.backgroundId,
      datos.level,
      extras.catalogoOrigen,
      extras.originChoices,
    ).skills;
    const solapa = periciasClaseDesdeElecciones(datos.classId, extras.originChoices.class).some(
      (skill) => skillsOrigen.includes(skill),
    );
    if (solapa) {
      return "Elige pericias de clase distintas a las del origen (trasfondo o especie).";
    }
    return validarExpertiseCreacion(datos.classId, datos.level, datos.expertise);
  }
  if (
    stepId === "atributos" &&
    !bonificacionAtributosCompleta(datos.backgroundId, extras.originChoices, extras.catalogoOrigen)
  ) {
    return "Elige cómo repartes la bonificación de atributos del trasfondo.";
  }
  if (stepId === "atributos") {
    const asignacion = validarAsignacionAtributos({
      modo: extras.modoAtributos,
      abilities: datos.abilities,
      tiradas4d6: extras.tiradas4d6,
      asignacion4d6: extras.asignacion4d6,
      asignacionArray: extras.asignacionArray,
    });
    if (asignacion) return asignacion;
    return validarMejorasCreacion(
      datos.mejorasNivel ?? [],
      cantidadMejorasAtributosHastaNivel(datos.classId, datos.level),
    );
  }
  if (stepId === "clase") {
    if (!datos.classId) return "Elige una clase.";
    if (datos.level >= nivelSubclase(datos.classId) && !datos.subclassId) {
      return "Elige una subclase: tu nivel ya permite (y exige) la rama de clase.";
    }
    if (extras.faltaClase) return extras.faltaClase;
    if (extras.conjurosClaseMsg) return extras.conjurosClaseMsg;
    if (!extras.maestriasOk) return "Elige todas las maestrías de arma de tu clase.";
    return validarEstiloCombateCreacion(
      datos.classId,
      datos.level,
      datos.fightingStyleFeatId,
    );
  }
  if (stepId === "conjuros" || (stepId === "resumen" && extras.conjurosMsg)) {
    return extras.conjurosMsg;
  }
  if (stepId === "resumen") {
    const dotesOrigen = validarDotesOrigenCreacion(
      datos,
      extras.originChoices,
      extras.catalogoOrigen,
      { incluirPericiasClase: true },
    );
    if (dotesOrigen) return dotesOrigen;
    const mejoras = validarMejorasCreacion(
      datos.mejorasNivel ?? [],
      cantidadMejorasAtributosHastaNivel(datos.classId, datos.level),
    );
    if (mejoras) return mejoras;
    const expertise = validarExpertiseCreacion(datos.classId, datos.level, datos.expertise);
    if (expertise) return expertise;
    const estilo = validarEstiloCombateCreacion(
      datos.classId,
      datos.level,
      datos.fightingStyleFeatId,
    );
    if (estilo) return estilo;
  }
  return null;
}

/** Evita imports no usados si el archivo se usa solo para tests. */
export function hayAsignacionCompleta(asignacion: Partial<Record<AbilityKey, number>>): boolean {
  return ABILITY_KEYS.every((key) => asignacion[key] !== undefined);
}

export function eleccionClaseAsistenteOk(
  classId: string,
  choices: OriginChoices,
  opts: Parameters<typeof eleccionClaseCompleta>[2],
): boolean {
  return eleccionClaseCompleta(classId, choices, opts);
}

export function periciasAsistenteOk(classId: string, classChoices: Record<string, string>): boolean {
  return periciasClaseCompletas(classId, classChoices);
}
