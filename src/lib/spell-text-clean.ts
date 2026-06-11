import { pulirTextoReglasEs } from "./rules-text-polish";
import { repararTextoConjuroConReferencia } from "./spell-text-repair";

/** Limpia marcadores 5etools/Foundry para lectura en ficha. */
export function limpiarTextoConjuro(text: string, referenciaEn?: string): string {
  const pre = text
    .replace(/Using a Higher-Level Spell Slot\./gi, "Usar un espacio de conjuro de nivel superior.")
    .replace(/At Higher Levels\./gi, "A niveles superiores.")
    .replace(/MaterialDuración/g, "Material\nDuración");
  const reparado = repararTextoConjuroConReferencia(pre, referenciaEn);
  return pulirTextoReglasEs(reparado);
}
