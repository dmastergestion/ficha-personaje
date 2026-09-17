import { opcionesSinDuplicar } from "@/rules/choice-uniqueness";
import featMechanicsMeta from "@/data/srd/feat-mechanics-meta.json";
import featMetaJson from "@/data/srd/feat-meta.json";
import type { AbilityKey, ResourceRecharge, SkillKey } from "@/lib/constants";
import { SKILL_KEYS } from "@/lib/constants";
import { bonificadorCompetencia } from "@/rules/ability";
import { SKILL_LABELS_ES, ABILITY_LABELS_ES } from "@/rules/character";
import { nombreDote } from "@/rules/feat-text";
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

export type ContextoEleccionesDote = {
  occupiedSkills?: readonly string[];
};

export function periciasOcupadasFueraDeDote(
  character: Character,
  instanceId: string,
): SkillKey[] {
  const out = new Set<SkillKey>(character.proficiencies.skills);
  for (const feat of character.feats) {
    if (idInstanciaDote(feat) === instanceId) continue;
    if (feat.id !== "skilled") continue;
    for (const key of ["skill-1", "skill-2", "skill-3"] as const) {
      const raw = feat.choices?.[key];
      if (raw && (SKILL_KEYS as readonly string[]).includes(raw)) {
        out.add(raw as SkillKey);
      }
    }
  }
  return [...out];
}

export function eleccionesDote(
  feat: CharacterFeat,
  spells: { id: string; level: number; name: string }[],
  ctx?: ContextoEleccionesDote,
): FeatChoiceDefinition[] {
  if (feat.id === "magic-initiate") {
    const list = (feat.choices?.["spell-list"] ?? "") as MagicInitiateList;
    const listSpells = list
      ? spells.filter((s) => conjuroDisponibleParaClase(s.id, list, null))
      : [];
    const cantrips = listSpells
      .filter((s) => s.level === 0)
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    const level1 = listSpells
      .filter((s) => s.level === 1)
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
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
        options: opcionesSinDuplicar(
          cantrips.map((s) => ({ value: s.id, label: s.name })),
          feat.choices?.["cantrip-2"] ? [feat.choices["cantrip-2"]] : [],
          feat.choices?.["cantrip-1"],
        ),
      },
      {
        id: "cantrip-2",
        label: "Truco 2",
        options: opcionesSinDuplicar(
          cantrips.map((s) => ({ value: s.id, label: s.name })),
          feat.choices?.["cantrip-1"] ? [feat.choices["cantrip-1"]] : [],
          feat.choices?.["cantrip-2"],
        ),
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
    const ids = ["skill-1", "skill-2", "skill-3"] as const;
    return ids.map((id, index) => {
      const hermanas = ids
        .filter((other) => other !== id)
        .map((other) => feat.choices?.[other])
        .filter((v): v is string => !!v);
      return {
        id,
        label: `Pericia ${index + 1}`,
        hint: "No puedes repetir una pericia que ya tengas.",
        options: opcionesSinDuplicar(
          skillOpts,
          [...(ctx?.occupiedSkills ?? []), ...hermanas],
          feat.choices?.[id],
        ),
      };
    });
  }

  return [];
}

export function doteConfigCompleta(
  feat: CharacterFeat,
  ocupadas?: { skills?: readonly string[] },
): boolean {
  const defs = eleccionesDote(feat, [], { occupiedSkills: ocupadas?.skills });
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
      if (ocupadas?.skills?.includes(value)) return false;
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
        featName: nombreDote(feat.id) || feat.name,
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
        featName: nombreDote(feat.id) || feat.name,
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
        max: maxRecursoPorFormula(entry.maxFormula, character.identity.level, character.abilities),
        used: 0,
        recharge: entry.recharge,
        source: "feat",
        sourceLabel: nombreDote(feat.id) || feat.name,
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

export function fusionarEleccionesDote(
  feat: CharacterFeat,
  extra?: Record<string, string>,
): CharacterFeat {
  if (!extra || Object.keys(extra).length === 0) return feat;
  return { ...feat, choices: { ...feat.choices, ...extra } };
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

type FeatMetaCategory = {
  category?: string;
  ability?: AbilityKey;
  abilityMin?: number;
};

const featCatalog = featMetaJson as Record<string, FeatMetaCategory>;

export function claseConcedeEstiloCombate(classId: string, level: number): boolean {
  if (classId === "fighter" && level >= 1) return true;
  if (classId === "paladin" && level >= 2) return true;
  if (classId === "ranger" && level >= 2) return true;
  return false;
}

export function tieneRasgoEstiloCombate(character: Character): boolean {
  return character.identity.classes.some((c) => claseConcedeEstiloCombate(c.classId, c.level));
}

export function tieneDoteEstiloCombate(feats: readonly Pick<CharacterFeat, "id">[]): boolean {
  return feats.some((f) => featCatalog[f.id]?.category === "fighting-style");
}

export type ResultadoPrerrequisitoDote = {
  ok: boolean;
  razones: string[];
};

export function doteCumplePrerrequisitos(
  character: Character,
  featId: string,
): ResultadoPrerrequisitoDote {
  const category = featCatalog[featId]?.category;
  const razones: string[] = [];
  const level = character.identity.level;

  if (category === "general" && level < 4) {
    razones.push("Requiere nivel 4+");
  }
  if (category === "epic-boon" && level < 19) {
    razones.push("Requiere nivel 19+ (dote épica)");
  }
  if (category === "fighting-style" && !tieneRasgoEstiloCombate(character)) {
    razones.push("Requiere el rasgo Estilo de combate");
  }

  const ability = featCatalog[featId]?.ability;
  const abilityMin = featCatalog[featId]?.abilityMin;
  if (ability && abilityMin != null) {
    const score = character.abilities[ability];
    if (score < abilityMin) {
      razones.push(`Requiere ${ABILITY_LABELS_ES[ability]} ${abilityMin}+`);
    }
  }

  return { ok: razones.length === 0, razones };
}
