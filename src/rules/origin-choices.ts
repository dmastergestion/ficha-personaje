import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { ABILITY_LABELS_ES, SKILL_LABELS_ES } from "@/rules/character";
import { etiquetaHerramienta } from "@/lib/origin-text";
import type { OrigenCatalogo } from "@/rules/origin-benefits";
import { inferSpeciesGroupId } from "@/rules/species-catalog";

export type OriginChoiceScope = "species" | "background";

export type OriginChoiceEditable = "never" | "until-level-3" | "always";

export interface OriginChoiceOption {
  value: string;
  label: string;
}

export interface OriginChoiceDefinition {
  id: string;
  scope: OriginChoiceScope;
  label: string;
  hint?: string;
  options: OriginChoiceOption[];
  defaultValue?: string;
  editable: OriginChoiceEditable;
}

export interface OriginChoices {
  species: Record<string, string>;
  background: Record<string, string>;
}

export const ORIGIN_CHOICES_EMPTY: OriginChoices = { species: {}, background: {} };

const KEEN_SENSES_OPTIONS: OriginChoiceOption[] = (
  ["insight", "perception", "survival"] as SkillKey[]
).map((id) => ({ value: id, label: SKILL_LABELS_ES[id] }));

const CELESTIAL_REVELATION_OPTIONS: OriginChoiceOption[] = [
  { value: "heavenly-wings", label: "Alas celestiales" },
  { value: "inner-radiance", label: "Resplandor interior" },
  { value: "necrotic-shroud", label: "Manto necrótico" },
];

const SIZE_OPTIONS: OriginChoiceOption[] = [
  { value: "S", label: "Pequeño" },
  { value: "M", label: "Mediano" },
];

const EQUIPMENT_OPTIONS: OriginChoiceOption[] = [
  { value: "A", label: "Equipo A (paquete del trasfondo)" },
  { value: "B", label: "Equipo B (50 po)" },
];

const ABILITY_MODE_OPTIONS: OriginChoiceOption[] = [
  { value: "even", label: "+1 a los tres atributos del trasfondo" },
  { value: "split", label: "+2 a uno y +1 a otro" },
];

const GAMING_SET_OPTIONS: OriginChoiceOption[] = [
  { value: "dice", label: "Juego de dados" },
  { value: "playing-cards", label: "Baraja de cartas" },
  { value: "dragonchess", label: "Dragajedrez" },
  { value: "three-dragon-ante", label: "Tres dragones al ante" },
];

const MUSICAL_INSTRUMENT_OPTIONS: OriginChoiceOption[] = [
  { value: "bagpipes", label: "Gaita" },
  { value: "drum", label: "Tambor" },
  { value: "dulcimer", label: "Dulcémele" },
  { value: "flute", label: "Flauta" },
  { value: "lute", label: "Laúd" },
  { value: "lyre", label: "Lira" },
  { value: "horn", label: "Cuerno" },
  { value: "pan-flute", label: "Flauta de pan" },
  { value: "shawm", label: "Chirimía" },
  { value: "viol", label: "Viola" },
];

const ARTISAN_TOOL_OPTIONS: OriginChoiceOption[] = [
  "alchemist's supplies",
  "brewer's supplies",
  "calligrapher's supplies",
  "carpenter's tools",
  "cartographer's tools",
  "cobbler's tools",
  "cook's utensils",
  "glassblower's tools",
  "jeweler's tools",
  "leatherworker's tools",
  "mason's tools",
  "painter's supplies",
  "potter's tools",
  "smith's tools",
  "tinker's tools",
  "weaver's tools",
  "woodcarver's tools",
].map((value) => ({ value, label: etiquetaHerramienta(value) }));

const ABILITY_FROM_NAME: Record<string, AbilityKey> = {
  strength: "str",
  fuerza: "str",
  dexterity: "dex",
  destreza: "dex",
  constitution: "con",
  constitución: "con",
  constitucion: "con",
  intelligence: "int",
  inteligencia: "int",
  wisdom: "wis",
  sabiduría: "wis",
  sabiduria: "wis",
  charisma: "cha",
  carisma: "cha",
};

function atributosTrasfondoLista(traits?: string): AbilityKey[] {
  const match = traits?.match(/Ability Scores::\s*([^]+?)(?:\s+Feat::|$)/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((part) => ABILITY_FROM_NAME[part.trim().toLowerCase()])
    .filter((k): k is AbilityKey => !!k);
}

const SPECIES_GROUP_CHOICES: Record<string, OriginChoiceDefinition[]> = {
  aasimar: [
    {
      id: "size",
      scope: "species",
      label: "Tamaño",
      hint: "Los aasimar pueden ser pequeños o medianos.",
      options: SIZE_OPTIONS,
      defaultValue: "M",
      editable: "never",
    },
    {
      id: "celestial-revelation",
      scope: "species",
      label: "Revelación celestial",
      hint: "Eliges al alcanzar el nivel 3; puedes ajustarlo antes en la ficha.",
      options: CELESTIAL_REVELATION_OPTIONS,
      defaultValue: "heavenly-wings",
      editable: "until-level-3",
    },
  ],
  elf: [
    {
      id: "keen-senses",
      scope: "species",
      label: "Sentidos agudos",
      hint: "Pericia de origen del elfo.",
      options: KEEN_SENSES_OPTIONS,
      defaultValue: "perception",
      editable: "never",
    },
  ],
  human: [
    {
      id: "skillful",
      scope: "species",
      label: "Hábil (pericia)",
      hint: "El rasgo Hábil del humano otorga una pericia a tu elección.",
      options: Object.entries(SKILL_LABELS_ES).map(([value, label]) => ({ value, label })),
      defaultValue: "perception",
      editable: "never",
    },
  ],
};

function opcionesHerramientaTrasfondo(raw?: string): OriginChoiceOption[] | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("gaming set")) return GAMING_SET_OPTIONS;
  if (lower.includes("musical instrument")) return MUSICAL_INSTRUMENT_OPTIONS;
  if (lower.includes("artisan's tools")) return ARTISAN_TOOL_OPTIONS;
  return null;
}

function eleccionHerramientaTrasfondo(
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): OriginChoiceDefinition | null {
  const tools = catalogo?.background?.toolProficiencies ?? [];
  const choose = tools.find((t) => /choose one kind of/i.test(t));
  if (!choose) return null;
  const options = opcionesHerramientaTrasfondo(choose);
  if (!options?.length) return null;
  return {
    id: "tool",
    scope: "background",
    label: "Herramienta del trasfondo",
    hint: etiquetaHerramienta(choose),
    options,
    defaultValue: options[0]!.value,
    editable: "never",
  };
}

function eleccionesAtributosTrasfondo(
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): OriginChoiceDefinition[] {
  const traits = catalogo?.background?.traits;
  const attrs = atributosTrasfondoLista(traits);
  if (attrs.length < 3) return [];

  const attrOptions = attrs.map((key) => ({
    value: key,
    label: ABILITY_LABELS_ES[key],
  }));

  return [
    {
      id: "ability-mode",
      scope: "background",
      label: "Bonificación de atributos",
      hint: "Regla de trasfondo 2024: +2/+1 o +1 a los tres.",
      options: ABILITY_MODE_OPTIONS,
      defaultValue: "even",
      editable: "never",
    },
    {
      id: "ability-plus-2",
      scope: "background",
      label: "Atributo con +2",
      hint: "Solo si elegiste +2/+1.",
      options: attrOptions,
      defaultValue: attrs[0],
      editable: "never",
    },
    {
      id: "ability-plus-1",
      scope: "background",
      label: "Atributo con +1 (modo +2/+1)",
      hint: "Debe ser distinto del atributo con +2.",
      options: attrOptions,
      defaultValue: attrs[1],
      editable: "never",
    },
  ];
}

function tieneEquipoEleccion(traits?: string): boolean {
  return /Equipment::\s*Choose A or B/i.test(traits ?? "");
}

export function eleccionesEspecie(
  speciesId: string | null,
  _catalogo?: OrigenCatalogo,
): OriginChoiceDefinition[] {
  if (!speciesId) return [];
  const groupId = inferSpeciesGroupId(speciesId);
  return SPECIES_GROUP_CHOICES[groupId] ?? [];
}

export function eleccionesTrasfondo(
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): OriginChoiceDefinition[] {
  if (!backgroundId) return [];
  const out: OriginChoiceDefinition[] = [...eleccionesAtributosTrasfondo(backgroundId, catalogo)];
  const tool = eleccionHerramientaTrasfondo(backgroundId, catalogo);
  if (tool) out.push(tool);
  if (tieneEquipoEleccion(catalogo?.background?.traits)) {
    out.push({
      id: "equipment",
      scope: "background",
      label: "Equipo inicial",
      options: EQUIPMENT_OPTIONS,
      defaultValue: "A",
      editable: "never",
    });
  }
  return out;
}

export function todasEleccionesOrigen(
  speciesId: string | null,
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): OriginChoiceDefinition[] {
  return [...eleccionesEspecie(speciesId, catalogo), ...eleccionesTrasfondo(backgroundId, catalogo)];
}

export function eleccionVisible(
  def: OriginChoiceDefinition,
  choices: OriginChoices,
): boolean {
  if (def.id === "ability-plus-2" || def.id === "ability-plus-1") {
    return choices.background["ability-mode"] === "split";
  }
  return true;
}

export function esEleccionEditable(
  def: OriginChoiceDefinition,
  characterLevel: number,
): boolean {
  if (def.editable === "always") return true;
  if (def.editable === "until-level-3") return characterLevel < 3;
  return false;
}

export function valoresPorDefectoElecciones(
  speciesId: string | null,
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): OriginChoices {
  const species: Record<string, string> = {};
  const background: Record<string, string> = {};

  for (const def of eleccionesEspecie(speciesId, catalogo)) {
    if (def.defaultValue) species[def.id] = def.defaultValue;
  }
  for (const def of eleccionesTrasfondo(backgroundId, catalogo)) {
    if (def.defaultValue) background[def.id] = def.defaultValue;
  }

  return { species, background };
}

export function fusionarEleccionesOrigen(
  speciesId: string | null,
  backgroundId: string | null,
  actual: OriginChoices | undefined,
  catalogo?: OrigenCatalogo,
): OriginChoices {
  const defs = todasEleccionesOrigen(speciesId, backgroundId, catalogo);
  const defaults = valoresPorDefectoElecciones(speciesId, backgroundId, catalogo);
  const species: Record<string, string> = {};
  const background: Record<string, string> = {};

  for (const def of defs) {
    if (def.scope === "species") {
      const prev = actual?.species[def.id];
      const valid = prev && def.options.some((o) => o.value === prev);
      species[def.id] = valid ? prev : (defaults.species[def.id] ?? def.options[0]?.value ?? "");
    } else {
      const prev = actual?.background[def.id];
      const valid = prev && def.options.some((o) => o.value === prev);
      background[def.id] = valid ? prev : (defaults.background[def.id] ?? def.options[0]?.value ?? "");
    }
  }

  return { species, background };
}

export function eleccionesOrigenCompletas(
  speciesId: string | null,
  backgroundId: string | null,
  choices: OriginChoices,
  catalogo?: OrigenCatalogo,
): boolean {
  for (const def of todasEleccionesOrigen(speciesId, backgroundId, catalogo)) {
    if (!eleccionVisible(def, choices)) continue;
    const value =
      def.scope === "species" ? choices.species[def.id] : choices.background[def.id];
    if (!value) return false;
  }

  if (choices.background["ability-mode"] === "split") {
    const a = choices.background["ability-plus-2"];
    const b = choices.background["ability-plus-1"];
    if (!a || !b || a === b) return false;
  }

  return true;
}

export function bonificadoresDesdeElecciones(
  traits: string | undefined,
  choices: OriginChoices,
): Partial<Record<AbilityKey, number>> {
  const attrs = atributosTrasfondoLista(traits);
  if (attrs.length < 3) return {};

  const mode = choices.background["ability-mode"] ?? "even";
  if (mode === "even") {
    return Object.fromEntries(attrs.map((key) => [key, 1])) as Partial<Record<AbilityKey, number>>;
  }

  const plus2 = choices.background["ability-plus-2"] as AbilityKey | undefined;
  const plus1 = choices.background["ability-plus-1"] as AbilityKey | undefined;
  if (!plus2 || !plus1 || plus2 === plus1) {
    return { [attrs[0]]: 2, [attrs[1]]: 1 };
  }

  return { [plus2]: 2, [plus1]: 1 };
}

export function periciaDesdeEleccionEspecie(
  choices: OriginChoices,
  choiceId: string,
): SkillKey | null {
  const raw = choices.species?.[choiceId];
  if (!raw) return null;
  return (Object.keys(SKILL_LABELS_ES) as SkillKey[]).includes(raw as SkillKey)
    ? (raw as SkillKey)
    : null;
}

export function herramientasDesdeElecciones(
  baseTools: string[],
  choices: OriginChoices,
): string[] {
  const out: string[] = [];
  for (const tool of baseTools) {
    if (/choose one kind of/i.test(tool)) {
      const picked = choices.background.tool;
      if (picked) {
        const options = opcionesHerramientaTrasfondo(tool);
        const label = options?.find((o) => o.value === picked)?.label ?? picked;
        out.push(label);
      }
      continue;
    }
    out.push(tool);
  }
  return out;
}

export function etiquetaEleccionOrigen(
  def: OriginChoiceDefinition,
  value: string | undefined,
): string {
  if (!value) return "—";
  return def.options.find((o) => o.value === value)?.label ?? value;
}

export function resumenEleccionesOrigen(
  speciesId: string | null,
  backgroundId: string | null,
  choices: OriginChoices,
  catalogo?: OrigenCatalogo,
): string[] {
  const lines: string[] = [];
  for (const def of todasEleccionesOrigen(speciesId, backgroundId, catalogo)) {
    if (!eleccionVisible(def, choices)) continue;
    const value =
      def.scope === "species" ? choices.species[def.id] : choices.background[def.id];
    if (!value) continue;
    lines.push(`${def.label}: ${etiquetaEleccionOrigen(def, value)}`);
  }
  return lines;
}
