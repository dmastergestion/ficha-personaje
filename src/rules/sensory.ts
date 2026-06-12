import { inferSpeciesGroupId } from "@/rules/species-catalog";

/** Alcance en pies a partir del texto de rasgos SRD (inglés o español). */
export function alcanceVisionOscuraDesdeTraits(traits: string | undefined): number | null {
  if (!traits) return null;

  const en = traits.match(/Darkvision:?\s*You have Darkvision with a range of (\d+) feet/i);
  if (en) return Number(en[1]);

  const es = traits.match(/Visión en la oscuridad[^.]*?(\d+)\s*pies/i);
  if (es) return Number(es[1]);

  const esM = traits.match(/visión en la oscuridad[^.]*?(\d+)\s*m/i);
  if (esM) return Math.round(Number(esM[1]) * 3.28084);

  return null;
}

export function alcanceVisionOscura(
  speciesId: string | null,
  traits?: string,
): number | null {
  const fromTraits = alcanceVisionOscuraDesdeTraits(traits);
  if (fromTraits) return fromTraits;

  if (!speciesId) return null;

  const fallback: Record<string, number> = {
    dwarf: 120,
    "elf-drow": 120,
  };
  return fallback[speciesId] ?? fallback[inferSpeciesGroupId(speciesId)] ?? null;
}

export function etiquetaVisionOscura(feet: number): string {
  const meters = Math.round(feet * 0.3048);
  return `Visión oscura ${feet} ft (${meters} m)`;
}
