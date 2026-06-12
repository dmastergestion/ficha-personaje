import backgroundMetaJson from "@/data/srd/background-meta.json";
import speciesMetaJson from "@/data/srd/species-meta.json";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_KEYS, SKILL_KEYS } from "@/lib/constants";
import { SKILL_LABELS_ES } from "@/rules/character";
import { idDoteDesdeTexto, nombreDote } from "@/rules/feat-text";
import { eleccionesPorDefectoDote } from "@/rules/feat-mechanics";
import {
  bonificadoresDesdeElecciones,
  herramientasDesdeElecciones,
  periciaDesdeEleccionEspecie as periciaDesdeEleccion,
  type OriginChoices,
} from "@/rules/origin-choices";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import type { SrdBackground, SrdSpecies } from "@/rules/srd";
import type { CharacterFeat } from "@/schemas/character";

type SpeciesMetaRow = {
  skillProficiencies?: string[];
  traits?: string;
};

type BackgroundMetaRow = {
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  feat?: string;
  traits?: string;
};

const speciesMeta = speciesMetaJson as Record<string, SpeciesMetaRow>;
const backgroundMeta = backgroundMetaJson as Record<string, BackgroundMetaRow>;

const ABILITY_FROM_NAME: Record<string, AbilityKey> = {
  strength: "str",
  fuerza: "str",
  dexterity: "dex",
  destreza: "dex",
  constitution: "con",
  constitución: "con",
  intelligence: "int",
  inteligencia: "int",
  wisdom: "wis",
  sabiduría: "wis",
  sabiduria: "wis",
  charisma: "cha",
  carisma: "cha",
};

const SKILL_ALIASES: Record<string, SkillKey> = {
  "sleight of hand": "sleightOfHand",
  "animal handling": "animalHandling",
};

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** Convierte texto de pericia SRD/5etools al id interno. */
export function normalizarPericia(raw: string): SkillKey | null {
  const trimmed = raw.trim();
  if (!trimmed || /^elegir:/i.test(trimmed)) return null;

  const token = trimmed.split(":").pop()?.trim() ?? trimmed;
  const lower = token.toLowerCase();

  if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower];

  const camel = lower
    .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-z0-9]/gi, "");
  if ((SKILL_KEYS as readonly string[]).includes(camel)) return camel as SkillKey;

  return null;
}

function periciasDesdeLista(lista?: string[]): SkillKey[] {
  if (!lista?.length) return [];
  const out: SkillKey[] = [];
  for (const entry of lista) {
    if (/elegir:/i.test(entry)) continue;
    const key = normalizarPericia(entry);
    if (key) out.push(key);
  }
  return uniq(out);
}

/** Etiquetas en español para pericias de origen (incluye líneas «a elegir»). */
export function etiquetasPericiasOrigen(raw?: string[]): string[] {
  if (!raw?.length) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (/elegir:/i.test(entry)) {
      const opts = entry
        .replace(/^elegir:\s*/i, "")
        .split(",")
        .map((part) => {
          const key = normalizarPericia(part.trim());
          return key ? SKILL_LABELS_ES[key] : part.trim();
        })
        .filter(Boolean);
      if (opts.length) out.push(`A elegir: ${opts.join(", ")}`);
      continue;
    }
    const key = normalizarPericia(entry);
    out.push(key ? SKILL_LABELS_ES[key] : entry);
  }
  return out;
}

export type OrigenCatalogo = {
  species?: Pick<SrdSpecies, "skillProficiencies" | "traits"> | null;
  background?: Pick<SrdBackground, "skillProficiencies" | "toolProficiencies" | "feat" | "traits"> | null;
};

function metaEspecie(
  speciesId: string | null,
  catalogo?: OrigenCatalogo,
): SpeciesMetaRow | undefined {
  const fromCatalog = catalogo?.species;
  if (fromCatalog) {
    return {
      skillProficiencies: fromCatalog.skillProficiencies,
      traits: fromCatalog.traits,
    };
  }
  if (!speciesId) return undefined;
  const groupId = inferSpeciesGroupId(speciesId);
  return { ...speciesMeta[groupId], ...speciesMeta[speciesId] };
}

function metaTrasfondo(
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): BackgroundMetaRow | undefined {
  const fromCatalog = catalogo?.background;
  if (fromCatalog) {
    return {
      skillProficiencies: fromCatalog.skillProficiencies,
      toolProficiencies: fromCatalog.toolProficiencies,
      feat: fromCatalog.feat,
      traits: fromCatalog.traits,
    };
  }
  if (!backgroundId) return undefined;
  return backgroundMeta[backgroundId];
}

export function origenCatalogoDesdeIds(
  speciesId: string | null,
  backgroundId: string | null,
  obtenerEspecie?: (id: string) => SrdSpecies | undefined,
  obtenerTrasfondo?: (id: string) => SrdBackground | undefined,
): OrigenCatalogo {
  return {
    species: speciesId && obtenerEspecie ? obtenerEspecie(speciesId) : undefined,
    background:
      backgroundId && obtenerTrasfondo ? obtenerTrasfondo(backgroundId) : undefined,
  };
}

/** Lista de tres atributos del trasfondo 2024 (orden SRD). */
export function atributosTrasfondoLista(traits?: string): AbilityKey[] {
  const match = traits?.match(/Ability Scores::\s*([^]+?)(?:\s+Feat::|$)/i);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((part) => ABILITY_FROM_NAME[part.trim().toLowerCase()])
    .filter((k): k is AbilityKey => !!k);
}

/** Atributos del trasfondo 2024 (+2 / +1 por defecto si no hay elección). */
export function bonificadoresAtributoTrasfondo(traits?: string): Partial<Record<AbilityKey, number>> {
  const keys = atributosTrasfondoLista(traits);
  if (keys.length < 3) return {};

  return {
    [keys[0]]: 2,
    [keys[1]]: 1,
    [keys[2]]: 1,
  };
}

export function aplicarBonificadoresAtributo(
  base: Record<AbilityKey, number>,
  bonuses: Partial<Record<AbilityKey, number>>,
): Record<AbilityKey, number> {
  const out = { ...base };
  for (const key of ABILITY_KEYS) {
    const extra = bonuses[key] ?? 0;
    if (extra) out[key] = Math.min(30, out[key] + extra);
  }
  return out;
}

export interface BeneficiosOrigen {
  skills: SkillKey[];
  toolProficiencies: string[];
  languages: string[];
  feat: CharacterFeat | null;
  speciesFeat: CharacterFeat | null;
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  hpBonusTotal: number;
}

export function calcularBeneficiosOrigen(
  speciesId: string | null,
  backgroundId: string | null,
  level: number,
  catalogo?: OrigenCatalogo,
  elecciones?: OriginChoices,
): BeneficiosOrigen {
  const species = metaEspecie(speciesId, catalogo);
  const background = metaTrasfondo(backgroundId, catalogo);

  const speciesSkills = periciasDesdeLista(species?.skillProficiencies);
  const backgroundSkills = periciasDesdeLista(background?.skillProficiencies);

  const keen =
    elecciones?.species ? periciaDesdeEleccion(elecciones, "keen-senses") : null;
  const skillful =
    elecciones?.species ? periciaDesdeEleccion(elecciones, "skillful") : null;
  if (keen) speciesSkills.push(keen);
  if (skillful) speciesSkills.push(skillful);

  let speciesFeat: CharacterFeat | null = null;
  const versatileId = elecciones?.species?.["versatile-feat"];
  if (versatileId && speciesId && inferSpeciesGroupId(speciesId) === "human") {
    speciesFeat = {
      id: versatileId,
      name: nombreDote(versatileId),
      choices: eleccionesPorDefectoDote(versatileId),
    };
  }

  let feat: CharacterFeat | null = null;
  if (background?.feat) {
    const featId = idDoteDesdeTexto(background.feat);
    if (featId) {
      const extra = background.feat.includes("—")
        ? background.feat.split("—").slice(1).join("—").trim()
        : background.feat.includes("-")
          ? background.feat.split("-").slice(1).join("-").trim()
          : "";
      feat = {
        id: featId,
        name: nombreDote(featId),
        notes: extra || undefined,
        choices: eleccionesPorDefectoDote(featId, extra),
      };
    }
  }

  const abilityBonuses =
    atributosTrasfondoLista(background?.traits).length < 3
      ? {}
      : elecciones
        ? bonificadoresDesdeElecciones(background?.traits, elecciones)
        : bonificadoresAtributoTrasfondo(background?.traits);

  let hpBonusTotal = 0;
  if (speciesId === "dwarf" || speciesId?.startsWith("dwarf")) {
    hpBonusTotal = level;
  }

  return {
    skills: uniq([...speciesSkills, ...backgroundSkills]),
    toolProficiencies: elecciones
      ? herramientasDesdeElecciones(background?.toolProficiencies ?? [], elecciones)
      : (background?.toolProficiencies ?? []),
    languages: [],
    feat,
    speciesFeat,
    abilityBonuses,
    hpBonusTotal,
  };
}
