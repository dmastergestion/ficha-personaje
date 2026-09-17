import type { Character } from "@/schemas/character";

export const WILD_HEART_RAGE_KEY = "wild-heart-rage";

export const WILD_HEART_RAGE_OPTIONS = [
  { value: "bear", label: "Oso", hint: "Resistencia a todo daño excepto fuerza, necrótico, psíquico y radiante." },
  { value: "eagle", label: "Águila", hint: "Al activar la Rabia puedes Retirarte y Correr como parte de esa acción." },
  { value: "wolf", label: "Lobo", hint: "Tus aliados tienen ventaja al atacar a enemigos a 5 pies (1,5 m) de ti." },
] as const;

export type WildHeartRageOption = (typeof WILD_HEART_RAGE_OPTIONS)[number]["value"];

/** Tipos que el Oso no resiste (PHB 2024). */
export const BEAR_RAGE_EXCEPT = new Set(["fuerza", "necrótico", "psíquico", "radiante"]);

export function nivelSubclase(
  character: Character,
  classId: string,
  subclassId: string,
): number {
  return (
    character.identity.classes.find(
      (c) => c.classId === classId && c.subclassId === subclassId,
    )?.level ?? 0
  );
}

export function esCorazonSalvaje(character: Character): boolean {
  return nivelSubclase(character, "barbarian", "wild-heart") >= 3;
}

export function esArbolDelMundo(character: Character): boolean {
  return nivelSubclase(character, "barbarian", "world-tree") >= 3;
}

export function opcionRabiaCorazonSalvaje(
  character: Character,
): WildHeartRageOption | null {
  if (!esCorazonSalvaje(character)) return null;
  const raw = character.originChoices.class[WILD_HEART_RAGE_KEY];
  if (raw === "bear" || raw === "eagle" || raw === "wolf") return raw;
  return "bear";
}

export function textoOpcionRabia(opcion: WildHeartRageOption | null): string {
  if (!opcion) return "";
  return WILD_HEART_RAGE_OPTIONS.find((o) => o.value === opcion)?.hint ?? "";
}
