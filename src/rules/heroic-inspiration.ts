import { inferSpeciesGroupId } from "@/rules/species-catalog";
import type { Character } from "@/schemas/character";

/** Reglas PHB 2024 — inspiración heroica (resumen para la ficha). */

export const INSPIRACION_HEROICA_TIP =
  "Gastas 1 inspiración para repetir un dado justo después de tirarlo (debes usar el nuevo resultado). Suele dártela el DM; no se recupera sola salvo rasgos concretos (p. ej. humano Ingenioso).";

export const INSPIRACION_HEROICA_DESCRIPCION = `La inspiración heroica (PHB 2024) sustituye a la antigua «inspiración» de mesa. Solo puedes tener una a la vez.

Obtener inspiración heroica
• Lo habitual es que el DM te la otorgue por actos heroicos, buen rol o momentos destacados de la partida.
• Algunos rasgos la dan de forma automática, por ejemplo:
  – Humano (Ingenioso / Resourceful): ganas inspiración heroica al terminar un descanso largo.
  – Guerrero campeón (Guerrero heroico, niv. 10): al empezar tu turno en combate, si no tienes ninguna.
  – Dote Músico: tras un descanso corto o largo puedes repartir inspiración heroica (incluida a ti).
• Si ya tienes una y ganarías otra, la pierdes salvo que se la cedas a otro PJ que no tenga.

Gastar inspiración heroica
• Inmediatamente después de tirar un dado, puedes gastarla para repetir ese dado; debes usar el nuevo resultado (no hace falta haber fallado la prueba).

En esta ficha, marca la casilla cuando la tengas y desmárcala al gastarla.`;

/** Humano (Resourceful): gana inspiración al terminar un descanso largo. */
export function humanoGanaInspiracionDescansoLargo(speciesId: string | null): boolean {
  if (!speciesId) return false;
  return inferSpeciesGroupId(speciesId) === "human";
}

/** Dote Músico: tras descanso corto o largo el personaje puede tener inspiración. */
export function musicoGanaInspiracionTrasDescanso(character: Character): boolean {
  return character.feats.some((f) => f.id === "musician");
}

/** Aplica reglas automáticas de inspiración heroica tras un descanso. */
export function aplicarInspiracionHeroicaTrasDescanso(
  character: Character,
  tipo: "short" | "long",
): Character {
  const gana =
    (tipo === "long" && humanoGanaInspiracionDescansoLargo(character.identity.speciesId)) ||
    musicoGanaInspiracionTrasDescanso(character);

  if (!gana || character.combat.inspiration) return character;

  return {
    ...character,
    combat: { ...character.combat, inspiration: true },
  };
}
