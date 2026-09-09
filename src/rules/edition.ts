/**
 * Contrato normativo del motor: **PHB / SRD 2024** (SRD 5.2.1).
 * Toda mecánica en `src/rules/` debe alinearse con esta edición.
 */
export const EDICION_REGLAS = "2024" as const;

/** Agotamiento PHB 2024: muerte al nivel 6. */
export const AGOTAMIENTO_MAX = 6;

/** PHB 2024: cada nivel resta 2×nivel a las tiradas d20 (ataque, salvación, prueba). */
export function penalizacionAgotamiento(nivel: number): number {
  if (nivel <= 0) return 0;
  return -2 * nivel;
}

/** PHB 2024: cada nivel resta 5 pies de velocidad. */
export function reduccionVelocidadAgotamiento(nivel: number): number {
  if (nivel <= 0) return 0;
  return 5 * nivel;
}

/** PHB 2024: descanso largo recupera todos los dados de golpe gastados. */
export function dadosGolpeRecuperadosDescansoLargo(gastados: number): number {
  return Math.max(0, gastados);
}
