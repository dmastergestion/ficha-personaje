/** Modificador de atributo D&D: floor((score - 10) / 2). */
export function modificadorAtributo(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Bonificador de competencia por nivel de personaje. */
export function bonificadorCompetencia(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function esProficiente(proficient: boolean): boolean {
  return proficient;
}
