import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { aplicarMejoraAtributos } from "@/rules/level-up";
import { eleccionesPorDefectoDote, fusionarEleccionesDote, sincronizarMecanicasDotes } from "@/rules/feat-mechanics";
import { nombreDote } from "@/rules/feat-text";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { bonusPgRobustez, pvMaximoPersonaje, recursosCompletos } from "@/rules/resources";
import type { Tirada4d6 } from "@/rules/dice";
import {
  aplicarBonificadoresAtributo,
  calcularBeneficiosOrigen,
  type OrigenCatalogo,
} from "@/rules/origin-benefits";
import { periciasClaseDesdeElecciones } from "@/rules/class-skills";
import { proficienciasIniciales } from "@/rules/proficiencies";
import {
  aplicarCompetenciasOrdenDivino,
  aplicarEquipoClase,
  fusionarEleccionesClase,
} from "@/rules/class-equipment";
import { atributoConjuroPredeterminado } from "@/rules/spell-lists";
import type { SeleccionConjuros } from "@/rules/spell-choices";
import { esLanzador } from "@/rules/spells";
import { obtenerClase } from "@/rules/srd";
import { fusionarEleccionesOrigen, type OriginChoices } from "@/rules/origin-choices";
import { aplicarEquipoTrasfondo } from "@/rules/origin-equipment";
import { ajustarMaestriasArmas } from "@/rules/weapon-mastery";
import { crearPersonajeVacio, type Character, type CharacterFeat } from "@/schemas/character";

export const ARRAY_ESTANDAR = [15, 14, 13, 12, 10, 8] as const;

/** Costes de compra de puntos PHB 2024 (presupuesto 27; 8 = 0 … 15 = 9). */
export const COSTES_POINT_BUY: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const PRESUPUESTO_POINT_BUY = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export function costePointBuy(score: number): number {
  return COSTES_POINT_BUY[score] ?? Number.POSITIVE_INFINITY;
}

export function puntosGastadosPointBuy(abilities: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((sum, key) => sum + costePointBuy(abilities[key]), 0);
}

export function pointBuyValido(abilities: Record<AbilityKey, number>): boolean {
  if (ABILITY_KEYS.some((key) => abilities[key] < POINT_BUY_MIN || abilities[key] > POINT_BUY_MAX)) {
    return false;
  }
  return puntosGastadosPointBuy(abilities) === PRESUPUESTO_POINT_BUY;
}

export function abilitiesPointBuyInicial(): Record<AbilityKey, number> {
  return Object.fromEntries(ABILITY_KEYS.map((k) => [k, 8])) as Record<AbilityKey, number>;
}

/** Índices aún libres para un atributo; el valor ya puesto en ese atributo sigue visible. */
export function indicesLibresAsignacion(
  asignacion: Partial<Record<AbilityKey, number>>,
  clave: AbilityKey,
  total: number,
): number[] {
  const ocupados = new Set<number>();
  for (const key of ABILITY_KEYS) {
    if (key === clave) continue;
    const i = asignacion[key];
    if (i !== undefined) ocupados.add(i);
  }
  const actual = asignacion[clave];
  const out: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === actual || !ocupados.has(i)) out.push(i);
  }
  return out;
}

export interface MejoraCreacion {
  modo: "asi" | "feat";
  asiDos: boolean;
  asiA: AbilityKey;
  asiB: AbilityKey;
  featId?: string;
}

export interface DatosAsistente {
  name: string;
  playerName: string;
  speciesId: string | null;
  backgroundId: string | null;
  classId: string | null;
  subclassId: string | null;
  level: number;
  abilities: Record<AbilityKey, number>;
  originChoices?: OriginChoices;
  weaponMasteries?: string[];
  spellSelection?: SeleccionConjuros;
  fightingStyleFeatId?: string | null;
  mejorasNivel?: MejoraCreacion[];
  expertise?: SkillKey[];
  /** Elecciones mecánicas de dotes de origen (Hábil, Iniciado en la magia…). */
  featChoices?: Record<string, Record<string, string>>;
}

/** Asigna manualmente los seis valores del array estándar a atributos. */
export function asignarArrayEstandarManual(
  asignacion: Partial<Record<AbilityKey, number>>,
): Record<AbilityKey, number> | null {
  if (ABILITY_KEYS.some((key) => asignacion[key] === undefined)) return null;

  const indices = ABILITY_KEYS.map((key) => asignacion[key]!);
  if (new Set(indices).size !== ABILITY_KEYS.length) return null;
  if (indices.some((index) => index < 0 || index >= ARRAY_ESTANDAR.length)) return null;

  return Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, ARRAY_ESTANDAR[asignacion[key]!]!]),
  ) as Record<AbilityKey, number>;
}

export function asignarArrayEstandar(classId: string): Record<AbilityKey, number> {
  const clase = obtenerClase(classId);
  const prioridad: AbilityKey[] = [];
  for (const key of clase?.primaryAbilities ?? ["str"]) {
    if (!prioridad.includes(key)) prioridad.push(key);
  }
  if (!prioridad.includes("con")) prioridad.push("con");
  for (const key of ABILITY_KEYS) {
    if (!prioridad.includes(key)) prioridad.push(key);
  }

  const valores = [...ARRAY_ESTANDAR];
  const result = Object.fromEntries(ABILITY_KEYS.map((k) => [k, 10])) as Record<
    AbilityKey,
    number
  >;

  prioridad.forEach((key, index) => {
    if (valores[index] !== undefined) result[key] = valores[index]!;
  });

  return result;
}

/** Asigna seis tiradas 4d6 a atributos (cada tirada solo una vez). */
export function asignarTiradas4d6(
  tiradas: Tirada4d6[],
  asignacion: Partial<Record<AbilityKey, number>>,
): Record<AbilityKey, number> | null {
  if (tiradas.length < 6) return null;
  if (ABILITY_KEYS.some((key) => asignacion[key] === undefined)) return null;

  const indices = ABILITY_KEYS.map((key) => asignacion[key]!);
  if (new Set(indices).size !== ABILITY_KEYS.length) return null;
  if (indices.some((index) => index < 0 || index >= tiradas.length)) return null;

  return Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, tiradas[asignacion[key]!]!.total]),
  ) as Record<AbilityKey, number>;
}

export function pvMaximoNivel1(hitDie: string, conScore: number): number {
  return pvMaximoPersonaje(hitDie, conScore, 1);
}

export function crearPersonajeDesdeAsistente(
  datos: DatosAsistente,
  catalogo?: OrigenCatalogo,
): Character {
  if (!datos.classId) {
    throw new Error("Elige una clase.");
  }
  const clase = obtenerClase(datos.classId);
  const hitDie = clase?.hitDie ?? "d8";
  const originChoices = fusionarEleccionesClase(
    datos.classId,
    fusionarEleccionesOrigen(
      datos.speciesId,
      datos.backgroundId,
      datos.originChoices,
      catalogo,
    ),
    { classLevel: datos.level },
  );
  const origen = calcularBeneficiosOrigen(
    datos.speciesId,
    datos.backgroundId,
    datos.level,
    catalogo,
    originChoices,
  );
  const abilities = aplicarBonificadoresAtributo(datos.abilities, origen.abilityBonuses);
  const abilitiesConAsi = (datos.mejorasNivel ?? []).reduce((scores, mejora) => {
    if (mejora.modo !== "asi") return scores;
    return aplicarMejoraAtributos(scores, mejora.asiA, mejora.asiB, mejora.asiDos);
  }, abilities);
  const dotesExtra: CharacterFeat[] = [];
  if (datos.fightingStyleFeatId) {
    dotesExtra.push({
      id: datos.fightingStyleFeatId,
      instanceId: crypto.randomUUID(),
      name: nombreDote(datos.fightingStyleFeatId),
      choices: eleccionesPorDefectoDote(datos.fightingStyleFeatId),
    });
  }
  for (const mejora of datos.mejorasNivel ?? []) {
    if (mejora.modo !== "feat" || !mejora.featId) continue;
    dotesExtra.push({
      id: mejora.featId,
      instanceId: crypto.randomUUID(),
      name: nombreDote(mejora.featId),
      choices: eleccionesPorDefectoDote(mejora.featId),
    });
  }
  const featsOrigen = [
    ...(origen.speciesFeat ? [origen.speciesFeat] : []),
    ...(origen.feat ? [origen.feat] : []),
    ...dotesExtra,
  ].map((f) => fusionarEleccionesDote(f, datos.featChoices?.[f.id]));
  const hpMax =
    pvMaximoPersonaje(hitDie, abilitiesConAsi.con, datos.level) +
    origen.hpBonusTotal +
    bonusPgRobustez(featsOrigen, datos.level);
  const draft = crearPersonajeVacio({
    name: datos.name.trim(),
    playerName: datos.playerName.trim(),
    classId: datos.classId,
    speciesId: datos.speciesId,
    level: datos.level,
  });
  const spellAbility = esLanzador(datos.classId)
    ? atributoConjuroPredeterminado({
        ...draft,
        abilities: abilitiesConAsi,
        identity: {
          ...draft.identity,
          subclassId: datos.subclassId,
          classes: [{ classId: datos.classId, subclassId: datos.subclassId, level: datos.level }],
        },
      })
    : null;

  const classSkills = periciasClaseDesdeElecciones(datos.classId, originChoices.class);
  const baseProfs = proficienciasIniciales(
    datos.classId,
    origen.skills,
    origen.toolProficiencies,
    classSkills,
  );
  const proficiencies = {
    ...baseProfs,
    ...aplicarCompetenciasOrdenDivino(
      datos.classId,
      originChoices,
      baseProfs.armorProficiencies,
      baseProfs.weaponProficiencies,
    ),
  };

  const languages = [...draft.proficiencies.languages, ...origen.languages];
  const feats = featsOrigen.map((f) => ({
    ...f,
    instanceId: f.instanceId ?? crypto.randomUUID(),
  }));

  const personaje = poblarRecursosSugeridos(
    recursosCompletos({
    ...draft,
    identity: {
      ...draft.identity,
      subclassId: datos.subclassId,
      backgroundId: datos.backgroundId,
      classes: [
        {
          classId: datos.classId,
          subclassId: datos.subclassId,
          level: datos.level,
        },
      ],
    },
    abilities: abilitiesConAsi,
    proficiencies: {
      savingThrows: proficiencies.savingThrows,
      skills: proficiencies.skills,
      skillOverrides: {},
      expertise: [...new Set(datos.expertise ?? [])],
      languages: [...new Set(languages)],
      armorProficiencies: proficiencies.armorProficiencies,
      weaponProficiencies: proficiencies.weaponProficiencies,
      toolProficiencies: proficiencies.toolProficiencies,
    },
    feats,
    originChoices,
    weaponMasteries: datos.weaponMasteries ?? [],
    combat: {
      ...draft.combat,
      hitDie,
      hpMax,
      hpCurrent: hpMax,
      hitDiceTotal: datos.level,
      hitDiceUsed: 0,
    },
    spells: {
      ...draft.spells,
      abilityKey: spellAbility,
      cantripsKnown: datos.spellSelection?.cantripsKnown ?? [],
      spellsKnown: datos.spellSelection?.spellsKnown ?? [],
      spellsPrepared: datos.spellSelection?.spellsPrepared ?? [],
    },
    }),
  );

  return aplicarEquipoTrasfondo(
    aplicarEquipoClase(ajustarMaestriasArmas(sincronizarMecanicasDotes(personaje))),
    catalogo,
  );
}
