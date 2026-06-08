import type { AbilityKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { modificadorAtributo } from "@/rules/ability";
import { proficienciasIniciales } from "@/rules/proficiencies";
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

export function pvMaximoNivel1(hitDie: string, conScore: number): number {
  const match = /^d(\d+)$/i.exec(hitDie.trim());
  const maxDie = match ? Number.parseInt(match[1] ?? "8", 10) : 8;
  return Math.max(1, maxDie + modificadorAtributo(conScore));
}

export function crearPersonajeDesdeAsistente(datos: DatosAsistente): Character {
  const clase = obtenerClase(datos.classId);
  const hitDie = clase?.hitDie ?? "d8";
  const hpMax = pvMaximoNivel1(hitDie, datos.abilities.con);
  const spellAbility =
    esLanzador(datos.classId) && clase?.primaryAbilities[0]
      ? clase.primaryAbilities[0]
      : null;

  const character = crearPersonajeVacio({
    name: datos.name.trim(),
    playerName: datos.playerName.trim(),
    classId: datos.classId,
    speciesId: datos.speciesId,
    level: datos.level,
  });

  const proficiencies = proficienciasIniciales(datos.classId, datos.backgroundId);

  return {
    ...character,
    identity: {
      ...character.identity,
      subclassId: datos.subclassId,
      backgroundId: datos.backgroundId,
    },
    abilities: { ...datos.abilities },
    proficiencies: {
      savingThrows: proficiencies.savingThrows,
      skills: proficiencies.skills,
      skillOverrides: {},
    },
    combat: {
      ...character.combat,
      hitDie,
      hpMax,
      hpCurrent: hpMax,
      hitDiceTotal: datos.level,
    },
    spells: {
      ...character.spells,
      abilityKey: spellAbility,
    },
  };
}
