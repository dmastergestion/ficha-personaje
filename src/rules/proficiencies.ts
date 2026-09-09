import type { AbilityKey, SkillKey } from "@/lib/constants";
import { etiquetaHerramienta } from "@/lib/origin-text";
import classProfMeta from "@/data/srd/class-prof-meta.json";
import type { Character } from "@/schemas/character";
import { obtenerArma, obtenerArmadura } from "@/rules/srd";

/** Salvaciones proficientes por clase — SRD 2024 (12 clases). */
export const SALVACIONES_CLASE: Record<string, AbilityKey[]> = {
  barbarian: ["str", "con"],
  bard: ["dex", "cha"],
  cleric: ["wis", "cha"],
  druid: ["int", "wis"],
  fighter: ["str", "con"],
  monk: ["str", "dex"],
  paladin: ["wis", "cha"],
  ranger: ["str", "dex"],
  rogue: ["dex", "int"],
  sorcerer: ["con", "cha"],
  warlock: ["wis", "cha"],
  wizard: ["int", "wis"],
};

type ClassProfMeta = Record<
  string,
  { armor: string[]; weapons: string[]; tools: string[] }
>;

const profMeta = classProfMeta as ClassProfMeta;

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function competenciasClase(classId: string): {
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
} {
  const row = profMeta[classId];
  return {
    armorProficiencies: row?.armor ?? [],
    weaponProficiencies: row?.weapons ?? [],
    toolProficiencies: row?.tools ?? [],
  };
}

export function proficienciasIniciales(
  classId: string,
  originSkills: SkillKey[] = [],
  originTools: string[] = [],
  classSkills: SkillKey[] = [],
): {
  savingThrows: AbilityKey[];
  skills: SkillKey[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
} {
  const savingThrows = [...(SALVACIONES_CLASE[classId] ?? [])];
  const classProf = competenciasClase(classId);
  return {
    savingThrows,
    skills: uniq([...originSkills, ...classSkills]),
    armorProficiencies: [...classProf.armorProficiencies],
    weaponProficiencies: [...classProf.weaponProficiencies],
    toolProficiencies: uniq([...classProf.toolProficiencies, ...originTools]),
  };
}

export function esCompetenteConArma(character: Character, weaponId: string | null): boolean {
  if (!weaponId) return true;
  const weapon = obtenerArma(weaponId);
  if (!weapon) return true;

  const profs = character.proficiencies.weaponProficiencies.map((p) => p.toLowerCase().trim());
  if (profs.length === 0) return false;

  const category = weapon.category.toLowerCase();
  const isMartial = category.startsWith("martial");
  const isSimple = category.startsWith("simple");
  const props = new Set(weapon.properties.map((p) => p.toLowerCase()));
  const hasLight = props.has("lgt") || props.has("light");
  const hasFinesse = props.has("fin") || props.has("finesse");

  for (const p of profs) {
    if (p === weapon.id || p === weaponId.toLowerCase()) return true;

    const martialVariant = p.match(/^martial\s*\((.+)\)$/);
    if (martialVariant) {
      if (!isMartial) continue;
      const tokens = martialVariant[1]!.split(/[/,]/).map((part) => part.trim());
      const wantsLight = tokens.includes("light") || tokens.includes("ligeras");
      const wantsFinesse = tokens.includes("finesse") || tokens.includes("sutiles") || tokens.includes("sutil");
      if (wantsLight && wantsFinesse) {
        if (hasLight || hasFinesse) return true;
        continue;
      }
      if (wantsLight && hasLight) return true;
      if (wantsFinesse && hasFinesse) return true;
      continue;
    }

    if (p === "martial" && isMartial) return true;
    if (p === "simple" && isSimple) return true;
    if (p === category) return true;
  }

  return false;
}

export function esCompetenteConArmadura(
  character: Character,
  category: string | null | undefined,
): boolean {
  if (!category) return true;
  const cat = category.toLowerCase();
  const profs = character.proficiencies.armorProficiencies.map((p) => p.toLowerCase().trim());
  if (profs.includes(cat)) return true;
  if (cat === "shield") return profs.includes("shield") || profs.includes("escudos");
  return false;
}

/** Armadura o escudo puestos sin adiestramiento (2024: desventaja FUE/DES y no lanzar). */
export function llevaArmaduraSinAdiestramiento(character: Character): boolean {
  const armor = obtenerArmadura(character.equipment.armorId);
  if (armor && armor.category !== "shield" && !esCompetenteConArmadura(character, armor.category)) {
    return true;
  }
  if (character.equipment.shieldEquipped && !esCompetenteConArmadura(character, "shield")) {
    return true;
  }
  return false;
}

export function desventajaPruebaCaracteristica(
  character: Character,
  ability: AbilityKey,
  skill?: SkillKey,
): boolean {
  if (llevaArmaduraSinAdiestramiento(character) && (ability === "str" || ability === "dex")) {
    return true;
  }
  if (skill === "stealth") {
    const armor = obtenerArmadura(character.equipment.armorId);
    if (armor?.stealthDisadvantage) return true;
  }
  return false;
}

const ARMOR_PROF_LABELS_ES: Record<string, string> = {
  light: "Ligera",
  medium: "Media",
  heavy: "Pesada",
  shield: "Escudos",
};

const WEAPON_PROF_TOKEN_ES: Record<string, string> = {
  simple: "Simples",
  martial: "Marciales",
  light: "ligeras",
  finesse: "sutiles",
};

/** Etiqueta legible de competencia en armadura (p. ej. light → Ligera). */
export function etiquetaCompetenciaArmadura(raw: string): string {
  return ARMOR_PROF_LABELS_ES[raw.trim().toLowerCase()] ?? raw;
}

/** Etiqueta legible de competencia en armas (p. ej. simple, martial (light)). */
export function etiquetaCompetenciaArma(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const martialVariant = lower.match(/^martial\s*\((.+)\)$/);
  if (martialVariant) {
    const inner = martialVariant[1]!
      .split(/[/,]/)
      .map((part) => WEAPON_PROF_TOKEN_ES[part.trim()] ?? part.trim())
      .join("/");
    return `Marciales (${inner})`;
  }
  return WEAPON_PROF_TOKEN_ES[lower] ?? trimmed;
}

export function etiquetaListaCompetenciasArmadura(items: readonly string[]): string {
  return items.map(etiquetaCompetenciaArmadura).join(", ");
}

export function etiquetaListaCompetenciasArmas(items: readonly string[]): string {
  return items.map(etiquetaCompetenciaArma).join(", ");
}

export function etiquetaListaCompetenciasHerramientas(items: readonly string[]): string {
  return items.map(etiquetaHerramienta).join(", ");
}
