export const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

export const SKILL_KEYS = [
  "acrobatics",
  "animalHandling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleightOfHand",
  "stealth",
  "survival",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const SPELL_SLOT_LEVELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type SpellSlotLevel = (typeof SPELL_SLOT_LEVELS)[number];

export const SCHEMA_VERSION = 7 as const;

export const DAMAGE_TYPES = [
  "ácido",
  "contundente",
  "frío",
  "fuego",
  "fuerza",
  "eléctrico",
  "necrótico",
  "perforante",
  "veneno",
  "psíquico",
  "radiante",
  "cortante",
  "trueno",
] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];

export const COMMON_LANGUAGES = [
  "Común",
  "Enano",
  "Élfico",
  "Gigante",
  "Gnómico",
  "Goblin",
  "Mediano",
  "Orco",
  "Abisal",
  "Celestial",
  "Dracónico",
  "Infernal",
  "Primordial",
  "Silvano",
  "Infracomún",
] as const;

export const RESOURCE_RECHARGES = ["short", "long", "none"] as const;
export type ResourceRecharge = (typeof RESOURCE_RECHARGES)[number];
