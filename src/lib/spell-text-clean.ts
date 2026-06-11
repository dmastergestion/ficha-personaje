import { limpiarTextoFoundry, reemplazarReferenciasFoundry } from "./foundry-text-clean";

/** Limpia marcadores 5etools/Foundry para lectura en ficha. */
export function limpiarTextoConjuro(text: string): string {
  return reemplazarReferenciasFoundry(
    limpiarTextoFoundry(text)
      .replace(/Using a Higher-Level Spell Slot\./gi, "Usar un espacio de conjuro de nivel superior.")
      .replace(/At Higher Levels\./gi, "A niveles superiores.")
      .replace(/MaterialDuración/g, "Material\nDuración"),
  ).trim();
}
