import type { Character } from "@/schemas/character";

/** Dados de golpe disponibles para gastar en descanso corto. */
export function dadosGolpeDisponibles(character: Character): {
  disponibles: number;
  gastados: number;
  total: number;
} {
  const total = character.combat.hitDiceTotal;
  const gastados = Math.min(character.combat.hitDiceUsed, total);
  return {
    disponibles: Math.max(0, total - gastados),
    gastados,
    total,
  };
}

export function etiquetaDadosGolpe(character: Character): string {
  const { disponibles, total } = dadosGolpeDisponibles(character);
  return `${disponibles}/${total}`;
}
