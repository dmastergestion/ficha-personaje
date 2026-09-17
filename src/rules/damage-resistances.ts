import { resistenciasObjetosMagicos } from "@/rules/inventory";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import type { Character } from "@/schemas/character";

/** Aliases hacia los ids de `DAMAGE_TYPES` (p. ej. relámpago → eléctrico). */
const ALIAS_TIPO_DANO: Record<string, string> = {
  relámpago: "eléctrico",
  relampago: "eléctrico",
  lightning: "eléctrico",
  electrico: "eléctrico",
  cold: "frío",
  fire: "fuego",
  poison: "veneno",
  acid: "ácido",
  necrotic: "necrótico",
  radiant: "radiante",
  thunder: "trueno",
  psychic: "psíquico",
  force: "fuerza",
  bludgeoning: "contundente",
  slashing: "cortante",
  piercing: "perforante",
};

const DRAGONBORN_RESISTENCIA: Record<string, string> = {
  black: "ácido",
  blue: "eléctrico",
  brass: "fuego",
  bronze: "eléctrico",
  copper: "ácido",
  gold: "fuego",
  green: "veneno",
  red: "fuego",
  silver: "frío",
  white: "frío",
};

const TIEFLING_RESISTENCIA: Record<string, string> = {
  abyssal: "veneno",
  chthonic: "necrótico",
  infernal: "fuego",
};

export function normalizarTipoDano(raw: string): string {
  const n = raw.trim().toLowerCase();
  return ALIAS_TIPO_DANO[n] ?? n;
}

export function listaIncluyeTipoDano(list: readonly string[], tipo: string): boolean {
  const n = normalizarTipoDano(tipo);
  return list.some((t) => normalizarTipoDano(t) === n);
}

function uniqTipos(tipos: string[]): string[] {
  const out: string[] = [];
  for (const tipo of tipos) {
    if (!listaIncluyeTipoDano(out, tipo)) out.push(normalizarTipoDano(tipo));
  }
  return out;
}

/** Resistencias PHB 2024 derivadas de la especie (no persistir). */
export function resistenciasEspecie(speciesId: string | null): string[] {
  if (!speciesId) return [];
  const group = inferSpeciesGroupId(speciesId);

  if (group === "aasimar") return ["necrótico", "radiante"];
  if (group === "dwarf") return ["veneno"];

  if (speciesId.startsWith("dragonborn-")) {
    const color = speciesId.slice("dragonborn-".length);
    const tipo = DRAGONBORN_RESISTENCIA[color];
    return tipo ? [tipo] : [];
  }

  if (speciesId.startsWith("tiefling-")) {
    const linaje = speciesId.slice("tiefling-".length);
    const tipo = TIEFLING_RESISTENCIA[linaje];
    return tipo ? [tipo] : [];
  }

  return [];
}

/** Especie + objetos mágicos activos. No incluye las del campo persistido. */
export function resistenciasDerivadasPersonaje(character: Character): string[] {
  return uniqTipos([
    ...resistenciasEspecie(character.identity.speciesId),
    ...resistenciasObjetosMagicos(character),
  ]);
}
