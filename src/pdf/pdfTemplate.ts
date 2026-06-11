import { PDF_TEMPLATE_URL } from "@/pdf/official-field-map";

let disponible: boolean | null = null;

/** Comprueba si la plantilla oficial está desplegada (HEAD). */
export async function plantillaPdfDisponible(): Promise<boolean> {
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
