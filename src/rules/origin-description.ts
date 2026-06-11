import descriptionsJson from "@/data/i18n/origin-descriptions-es.json";
import { limpiarTextoOrigen } from "@/lib/origin-text";

type OriginDescriptions = {
  species: Record<string, string>;
  backgrounds: Record<string, string>;
};

const descriptions = descriptionsJson as OriginDescriptions;

/** Descripción narrativa en español de especie o trasfondo, si existe. */
export function descripcionOrigenEs(
  kind: "species" | "backgrounds",
  id: string,
  fallbackEn?: string,
): string | undefined {
  const map = kind === "species" ? descriptions.species : descriptions.backgrounds;
  const fromEs = map[id]?.trim();
  if (fromEs) return fromEs;
  if (fallbackEn?.trim()) return limpiarTextoOrigen(fallbackEn);
  return undefined;
}
