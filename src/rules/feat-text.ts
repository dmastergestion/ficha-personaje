import featDescriptionsEs from "@/data/i18n/feat-descriptions-es.json";
import featMetaJson from "@/data/srd/feat-meta.json";
import { pulirTextoReglasEs } from "@/lib/rules-text-polish";

type FeatMetaEntry = { description?: string; descriptionEs?: string };

type FeatMetaFull = FeatMetaEntry & { name?: string; nameEs?: string };

const featMeta = featMetaJson as Record<string, FeatMetaFull>;
const manualEs = featDescriptionsEs as Record<string, string>;

/** Convierte texto de trasfondo ("magic initiate — cleric") al id del catálogo. */
export function idDoteDesdeTexto(raw: string): string | undefined {
  const base = raw.split(/[—–-]/)[0]?.trim().toLowerCase().replace(/\s+/g, "-") ?? "";
  if (!base) return undefined;
  if (featMeta[base]) return base;
  const byName = Object.entries(featMeta).find(
    ([, m]) => m.name?.toLowerCase().replace(/\s+/g, "-") === base,
  );
  return byName?.[0];
}

export function nombreDote(id: string): string {
  const entry = featMeta[id];
  return entry?.nameEs || entry?.name || id;
}

/** Limpia marcadores 5etools/Foundry para lectura en ficha. */
export function limpiarTextoDote(text: string): string {
  return pulirTextoReglasEs(text);
}

export function descripcionDote(id: string, notes?: string): string | undefined {
  const entry = featMeta[id];
  if (!entry) return notes?.trim() || manualEs[id];

  const fromMeta = entry.descriptionEs ?? manualEs[id];
  if (fromMeta) return limpiarTextoDote(fromMeta);

  if (entry.description) return limpiarTextoDote(entry.description);
  return notes?.trim() || undefined;
}
