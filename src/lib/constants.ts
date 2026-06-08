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

export const SCHEMA_VERSION = 2 as const;
