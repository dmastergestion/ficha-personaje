import featMechanicsMeta from "@/data/srd/feat-mechanics-meta.json";
import type { AbilityKey, ResourceRecharge, SkillKey } from "@/lib/constants";
import { SKILL_KEYS } from "@/lib/constants";
import { bonificadorCompetencia } from "@/rules/ability";
import { SKILL_LABELS_ES, ABILITY_LABELS_ES } from "@/rules/character";
import { ATRIBUTO_CONJURO_CLASE, conjuroDisponibleParaClase } from "@/rules/spell-lists";
import { maxRecursoPorFormula } from "@/rules/weapon-mastery";
import type { Character, CharacterFeat, CharacterResource } from "@/schemas/character";

type FeatResourceMeta = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  maxFormula: string;
};

type FeatMechanicsEntry = {
  resources?: FeatResourceMeta[];
  initiativeProficiency?: boolean;
  skillChoices?: number;
  tools?: string[];
};

const mechanicsMeta = featMechanicsMeta as Record<string, FeatMechanicsEntry>;

export const MAGIC_INITIATE_LISTS = ["cleric", "druid", "wizard"] as const;
export type MagicInitiateList = (typeof MAGIC_INITIATE_LISTS)[number];

export const MAGIC_INITIATE_LIST_LABELS: Record<MagicInitiateList, string> = {
  cleric: "Clérigo",
  druid: "Druida",
  wizard: "Mago",
};

export type FeatChoiceDefinition = {
  id: string;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
};

export type FeatSpellGrant = {
  featInstanceId: string;
  featId: string;
  featName: string;
  spellId: string;
  level: number;
  abilityKey: AbilityKey;
  listLabel: string;
  freeResourceId?: string;
};

export function idInstanciaDote(feat: CharacterFeat): string {
  return feat.instanceId ?? feat.id;
}

export function metaMecanicaDote(featId: string): FeatMechanicsEntry | undefined {
  return mechanicsMeta[featId];
}

export function listaIniciadoMagiaDesdeTexto(raw?: string): MagicInitiateList | null {
  const lower = raw?.toLowerCase() ?? "";
  if (lower.includes("cleric") || lower.includes("clérigo") || lower.includes("clerigo")) {
    return "cleric";
  }
  if (lower.includes("druid") || lower.includes("druida")) return "druid";
  if (lower.includes("wizard") || lower.includes("mago")) return "wizard";
  return null;
}

export function atributoListaIniciadoMagia(list: MagicInitiateList): AbilityKey {
  return ATRIBUTO_CONJURO_CLASE[list] ?? "int";
}

export function eleccionesPorDefectoDote(featId: string, notes?: string): Record<string, string> {
  if (featId !== "magic-initiate") return {};
  const list = listaIniciadoMagiaDesdeTexto(notes);
  if (!list) return {};
  return {
    "spell-list": list,
    "spell-ability": atributoListaIniciadoMagia(list),
  };
}

export function eleccionesDote(
  feat: CharacterFeat,
  spells: { id: string; level: number; name: string }[],
): FeatChoiceDefinition[] {
  if (feat.id === "magic-initiate") {
    const list = (feat.choices?.["spell-list"] ?? "") as MagicInitiateList;
    const listSpells = list
      ? spells.filter((s) => conjuroDisponibleParaClase(s.id, list, null))
      : [];
    const cantrips = listSpells.filter((s) => s.level === 0);
    const level1 = listSpells.filter((s) => s.level === 1);
    const abilityOpts: AbilityKey[] = ["int", "wis", "cha"];

    return [
      {
        id: "spell-list",
        label: "Lista de conjuros",
        hint: "Clérigo, druida o mago (PHB 2024).",
        options: MAGIC_INITIATE_LISTS.map((value) => ({
          value,
          label: MAGIC_INITIATE_LIST_LABELS[value],
        })),
      },
      {
        id: "spell-ability",
        label: "Característica de lanzamiento",
        options: abilityOpts.map((value) => ({ value, label: ABILITY_LABELS_ES[value] })),
      },
      {
        id: "cantrip-1",
        label: "Truco 1",
        options: cantrips.map((s) => ({ value: s.id, label: s.name })),
      },
      {
        id: "cantrip-2",
        label: "Truco 2",
        options: cantrips.map((s) => ({ value: s.id, label: s.name })),
      },
      {
        id: "spell-1",
        label: "Conjuro de nivel 1",
        options: level1.map((s) => ({ value: s.id, label: s.name })),
      },
    ];
  }

  if (feat.id === "skilled") {
    const skillOpts = (SKILL_KEYS as readonly SkillKey[]).map((value) => ({
      value,
      label: SKILL_LABELS_ES[value],
    }));
    return [
      { id: "skill-1", label: "Pericia 1", options: skillOpts },
      { id: "skill-2", label: "Pericia 2", options: skillOpts },
      { id: "skill-3", label: "Pericia 3", options: skillOpts },
    ];
  }

  return [];
}

export function doteConfigCompleta(feat: CharacterFeat): boolean {
  const defs = eleccionesDote(feat, []);
  if (defs.length === 0) return true;

  for (const def of defs) {
    const value = feat.choices?.[def.id];
    if (!value) return false;
    if (def.id === "cantrip-2" && value === feat.choices?.["cantrip-1"]) return false;
    if (def.id.startsWith("skill-")) {
      const others = defs
        .filter((d) => d.id.startsWith("skill-") && d.id !== def.id)
        .map((d) => feat.choices?.[d.id]);
      if (others.includes(value)) return false;
    }
  }
  return true;
}

export function conjurosOtorgadosPorDotes(character: Character): FeatSpellGrant[] {
  const grants: FeatSpellGrant[] = [];

  for (const feat of character.feats) {
    if (feat.id !== "magic-initiate") continue;
    const list = feat.choices?.["spell-list"] as MagicInitiateList | undefined;
    if (!list) continue;

    const ability =
      (feat.choices?.["spell-ability"] as AbilityKey | undefined) ??
      atributoListaIniciadoMagia(list);
    const instanceId = idInstanciaDote(feat);
    const listLabel = MAGIC_INITIATE_LIST_LABELS[list] ?? list;

    for (const key of ["cantrip-1", "cantrip-2"] as const) {
      const spellId = feat.choices?.[key];
      if (!spellId) continue;
      grants.push({
        featInstanceId: instanceId,
        featId: feat.id,
        featName: feat.name,
        spellId,
        level: 0,
        abilityKey: ability,
        listLabel,
      });
    }

    const spell1 = feat.choices?.["spell-1"];
    if (spell1) {
      grants.push({
        featInstanceId: instanceId,
        featId: feat.id,
        featName: feat.name,
        spellId: spell1,
        level: 1,
        abilityKey: ability,
        listLabel,
        freeResourceId: `feat:${instanceId}:free-cast-1`,
      });
    }
  }

  return grants;
}

export function recursosDote(character: Character): CharacterResource[] {
  const out: CharacterResource[] = [];

  for (const feat of character.feats) {
    const meta = mechanicsMeta[feat.id];
    if (!meta?.resources?.length) continue;
    const instanceId = idInstanciaDote(feat);

    for (const entry of meta.resources) {
      out.push({
        id: `feat:${instanceId}:${entry.id}`,
        name: entry.name,
        max: maxRecursoPorFormula(entry.maxFormula, character.identity.level),
        used: 0,
        recharge: entry.recharge,
        source: "feat",
        sourceLabel: feat.name,
      });
    }
  }

  return out;
}

export function periciasExtraDotes(character: Character): SkillKey[] {
  const out: SkillKey[] = [];
  for (const feat of character.feats) {
    if (feat.id !== "skilled") continue;
    for (const key of ["skill-1", "skill-2", "skill-3"] as const) {
      const raw = feat.choices?.[key];
      if (raw && (SKILL_KEYS as readonly string[]).includes(raw)) {
        out.push(raw as SkillKey);
      }
    }
  }
  return out;
}

export function herramientasExtraDotes(character: Character): string[] {
  const out: string[] = [];
  for (const feat of character.feats) {
    const tools = mechanicsMeta[feat.id]?.tools ?? [];
    out.push(...tools);
  }
  return out;
}

export function tieneCompetenciaIniciativaDote(character: Character): boolean {
  return character.feats.some((f) => mechanicsMeta[f.id]?.initiativeProficiency);
}

export function bonificadorIniciativaDotes(character: Character): number {
  return tieneCompetenciaIniciativaDote(character)
    ? bonificadorCompetencia(character.identity.level)
    : 0;
}

export function sincronizarMecanicasDotes(character: Character): Character {
  let next = { ...character };

  if (conjurosOtorgadosPorDotes(next).length > 0 && !next.spells.abilityKey) {
    const ability = conjurosOtorgadosPorDotes(next)[0]?.abilityKey;
    if (ability) {
      next = {
        ...next,
        spells: { ...next.spells, abilityKey: ability },
      };
    }
  }

  return next;
}

export function actualizarEleccionDote(
  character: Character,
  instanceId: string,
  choiceId: string,
  value: string,
): Character {
  const feats = character.feats.map((feat) => {
    if (idInstanciaDote(feat) !== instanceId) return feat;
    const choices = { ...feat.choices, [choiceId]: value };
    if (choiceId === "spell-list") {
      choices["spell-ability"] = atributoListaIniciadoMagia(value as MagicInitiateList);
      delete choices["cantrip-1"];
      delete choices["cantrip-2"];
      delete choices["spell-1"];
    }
    return { ...feat, choices };
  });
  return sincronizarMecanicasDotes({ ...character, feats });
}
