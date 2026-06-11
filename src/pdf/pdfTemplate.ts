import { PDF_TEMPLATE_URL } from "@/pdf/official-field-map";

/** Export PDF solo en build local (`base: /`). GitHub Pages usa `/ficha-personaje/`. */
export const exportPdfHabilitado = import.meta.env.BASE_URL === "/";

let disponible: boolean | null = null;

/** Comprueba si la plantilla oficial está desplegada (HEAD). */
export async function plantillaPdfDisponible(): Promise<boolean> {
  if (!exportPdfHabilitado) return false;
  if (disponible !== null) return disponible;
  try {
    const res = await fetch(PDF_TEMPLATE_URL, { method: "HEAD" });
    disponible = res.ok;
  } catch {
    disponible = false;
  }
  return disponible;
}

export function reiniciarCachePlantillaPdf(): void {
  disponible = null;
}
