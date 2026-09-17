import maneuversJson from "@/data/srd/battle-master-maneuvers.json";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { tirarDadoDenominacion } from "@/rules/dice";
import { parsearInvocaciones } from "@/rules/invocations";
import type { OriginChoiceDefinition } from "@/rules/origin-choices";
import { ajustarRecurso } from "@/rules/resources-tracker";
import type { Character } from "@/schemas/character";

export const MANEUVERS_KEY = "battle-master-maneuvers";
export const SUPERIORITY_DICE_ID = "fighter:superiority-dice";

export type BattleMasterManeuver = {
  id: string;
  nameEs: string;
  hint: string;
};

const CATALOGO = maneuversJson as BattleMasterManeuver[];

const MAX_POR_NIVEL: [number, number][] = [
  [3, 3],
  [7, 5],
  [10, 7],
  [15, 9],
];

export function nivelMaestroBatalla(character: Character): number {
  const fighter = character.identity.classes.find((c) => c.classId === "fighter");
  if (!fighter || fighter.subclassId !== "battle-master") return 0;
  return fighter.level;
}

export function maxManiobras(fighterLevel: number): number {
  let max = 0;
  for (const [lvl, value] of MAX_POR_NIVEL) {
    if (fighterLevel >= lvl) max = value;
  }
  return max;
}

/** d8 (3+), d10 (10+), d12 (18+). */
export function dadoSuperioridad(fighterLevel: number): "d8" | "d10" | "d12" {
  if (fighterLevel >= 18) return "d12";
  if (fighterLevel >= 10) return "d10";
  return "d8";
}

export function catalogoManiobras(): BattleMasterManeuver[] {
  return CATALOGO;
}

export function maniobraPorId(id: string): BattleMasterManeuver | undefined {
  return CATALOGO.find((m) => m.id === id);
}

export function maniobrasConocidas(character: Character): string[] {
  return parsearInvocaciones(character.originChoices.class[MANEUVERS_KEY]);
}

export function cdManiobra(character: Character): number {
  const str = modificadorAtributo(character.abilities.str);
  const dex = modificadorAtributo(character.abilities.dex);
  return 8 + Math.max(str, dex) + bonificadorCompetencia(character.identity.level);
}

export function eleccionesManiobras(
  classId: string,
  fighterLevel: number,
  subclassId?: string | null,
): OriginChoiceDefinition[] {
  if (classId !== "fighter" || subclassId !== "battle-master" || fighterLevel < 3) return [];
  const max = maxManiobras(fighterLevel);
  if (max <= 0) return [];
  return [
    {
      id: MANEUVERS_KEY,
      scope: "class",
      label: "Maniobras de Maestro de batalla",
      hint: "Aprendes 3 a nivel 3 y 2 más en los niveles 7, 10 y 15. Una por ataque.",
      kind: "multi",
      maxSelections: max,
      options: CATALOGO.map((m) => ({ value: m.id, label: m.nameEs })),
      editable: "always",
    },
  ];
}

export type ResultadoManiobra =
  | { ok: true; character: Character; mensaje: string; dado: number }
  | { ok: false; error: string };

/** Gasta un dado de superioridad y lo tira. */
export function usarManiobra(
  character: Character,
  maneuverId: string,
  dadoFijo?: number,
): ResultadoManiobra {
  const nivel = nivelMaestroBatalla(character);
  if (nivel < 3) {
    return { ok: false, error: "Las maniobras requieren Maestro de batalla (nivel 3)." };
  }
  if (!maniobrasConocidas(character).includes(maneuverId)) {
    return { ok: false, error: "No conoces esa maniobra." };
  }
  const recurso = character.resources.find((r) => r.id === SUPERIORITY_DICE_ID);
  if (!recurso || recurso.used >= recurso.max) {
    return { ok: false, error: "No te quedan Dados de superioridad." };
  }
  const denom = dadoSuperioridad(nivel);
  const dado = dadoFijo ?? tirarDadoDenominacion(denom);
  const maniobra = maniobraPorId(maneuverId);
  const next = ajustarRecurso(character, SUPERIORITY_DICE_ID, 1);
  return {
    ok: true,
    character: next,
    dado,
    mensaje: `${maniobra?.nameEs ?? maneuverId}: ${denom} = ${dado}. CD ${cdManiobra(character)}. ${maniobra?.hint ?? ""}`.trim(),
  };
}
