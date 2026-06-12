import type { Character } from "@/schemas/character";
import {
  maxConjurosGrimorioPersonaje,
  maxConjurosPreparados,
  usaPreparadosMulticlase,
} from "@/rules/spells";

export function agregarConjuro(character: Character, spellId: string, level: number): Character {
  if (level === 0) {
    if (character.spells.cantripsKnown.includes(spellId)) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: [...character.spells.cantripsKnown, spellId],
      },
    };
  }

  const grimorioMax = maxConjurosGrimorioPersonaje(character);
  if (grimorioMax > 0 && !character.spells.spellsKnown.includes(spellId)) {
    if (character.spells.spellsKnown.length >= grimorioMax) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsKnown: [...character.spells.spellsKnown, spellId],
      },
    };
  }

  if (usaPreparadosMulticlase(character.identity.classes)) {
    if (character.spells.spellsPrepared.includes(spellId)) return character;
    if (character.spells.spellsPrepared.length >= maxConjurosPreparados(character)) {
      return character;
    }
    if (grimorioMax > 0 && !character.spells.spellsKnown.includes(spellId)) {
      return character;
    }
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: [...character.spells.spellsPrepared, spellId],
      },
    };
  }

  if (character.spells.spellsKnown.includes(spellId)) return character;
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: [...character.spells.spellsKnown, spellId],
    },
  };
}

export function quitarConjuro(
  character: Character,
  spellId: string,
  list: "cantrips" | "known" | "prepared",
): Character {
  if (list === "cantrips") {
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: character.spells.cantripsKnown.filter((s) => s !== spellId),
      },
    };
  }
  if (list === "prepared") {
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: character.spells.spellsPrepared.filter((s) => s !== spellId),
      },
    };
  }
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: character.spells.spellsKnown.filter((s) => s !== spellId),
    },
  };
}
