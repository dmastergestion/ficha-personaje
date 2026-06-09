import type { AbilityKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { pvMaximoPersonaje, recursosCompletos } from "@/rules/resources";
import type { Tirada4d6 } from "@/rules/dice";
import { proficienciasIniciales } from "@/rules/proficiencies";
import { atributoConjuroPredeterminado } from "@/rules/spell-lists";
import { esLanzador } from "@/rules/spells";
import { obtenerClase } from "@/rules/srd";
import { crearPersonajeVacio, type Character } from "@/schemas/character";

export const ARRAY_ESTANDAR = [15, 14, 13, 12, 10, 8] as const;

export interface DatosAsistente {
  name: string;
  playerName: string;
  speciesId: string | null;
  backgroundId: string | null;
  classId: string;
  subclassId: string | null;
  level: number;
  abilities: Record<AbilityKey, number>;
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

export function crearPersonajeDesdeAsistente(datos: DatosAsistente): Character {
  const clase = obtenerClase(datos.classId);
  const hitDie = clase?.hitDie ?? "d8";
  const hpMax = pvMaximoPersonaje(hitDie, datos.abilities.con, datos.level);
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
        identity: {
          ...draft.identity,
          subclassId: datos.subclassId,
          classes: [{ classId: datos.classId, subclassId: datos.subclassId, level: datos.level }],
        },
      })
    : null;

  const proficiencies = proficienciasIniciales(datos.classId, datos.backgroundId);

  return poblarRecursosSugeridos(
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
    abilities: { ...datos.abilities },
    proficiencies: {
      savingThrows: proficiencies.savingThrows,
      skills: proficiencies.skills,
      skillOverrides: {},
      languages: draft.proficiencies.languages,
      armorProficiencies: proficiencies.armorProficiencies,
      weaponProficiencies: proficiencies.weaponProficiencies,
      toolProficiencies: proficiencies.toolProficiencies,
    },
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
    },
    }),
  );
}
