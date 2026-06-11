import { z } from "zod";
import { CONDITION_IDS } from "@/lib/conditions";
import {
  ABILITY_KEYS,
  RESOURCE_RECHARGES,
  SCHEMA_VERSION,
  SKILL_KEYS,
  SPELL_SLOT_LEVELS,
} from "@/lib/constants";

const abilityKeySchema = z.enum(ABILITY_KEYS);
const skillKeySchema = z.enum(SKILL_KEYS);
const conditionIdSchema = z.enum(CONDITION_IDS);

const spellSlotsUsedSchema = z.object(
  Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, z.number().int().min(0)])) as Record<
    (typeof SPELL_SLOT_LEVELS)[number],
    z.ZodNumber
  >,
);

const deathSavesSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
});

const currencySchema = z.object({
  pp: z.number().int().min(0),
  gp: z.number().int().min(0),
  ep: z.number().int().min(0),
  sp: z.number().int().min(0),
  cp: z.number().int().min(0),
});

const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  max: z.number().int().min(0),
  used: z.number().int().min(0),
  recharge: z.enum(RESOURCE_RECHARGES),
});

const featSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
});

const roleplaySchema = z.object({
  personalityTraits: z.string(),
  ideals: z.string(),
  bonds: z.string(),
  flaws: z.string(),
  appearance: z.string(),
});

const equipmentItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.number().int().min(0),
  weightLb: z.number().min(0),
  notes: z.string().optional(),
  weaponId: z.string().nullable().optional(),
  magicBonus: z.number().int().min(0).max(3).optional(),
  abilityKey: abilityKeySchema.optional(),
  proficient: z.boolean().optional(),
  damage: z.string().optional(),
  attuned: z.boolean().optional(),
  requiresAttunement: z.boolean().optional(),
});

export const combatAttackSchema = z.object({
  id: z.string(),
  name: z.string(),
  abilityKey: abilityKeySchema,
  proficient: z.boolean(),
  damage: z.string().optional(),
  notes: z.string().optional(),
  weaponId: z.string().nullable().optional(),
  magicBonus: z.number().int().min(0).max(3).optional(),
});

export type CombatAttack = z.infer<typeof combatAttackSchema>;

export const ClassLevelSchema = z.object({
  classId: z.string().min(1),
  subclassId: z.string().nullable(),
  level: z.number().int().min(1).max(20),
});

export type ClassLevel = z.infer<typeof ClassLevelSchema>;

export type CharacterResource = z.infer<typeof resourceSchema>;
export type CharacterFeat = z.infer<typeof featSchema>;
export type CharacterCurrency = z.infer<typeof currencySchema>;
export type CharacterRoleplay = z.infer<typeof roleplaySchema>;

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  meta: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  identity: z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    playerName: z.string(),
    speciesId: z.string().nullable(),
    classId: z.string().min(1, "La clase es obligatoria"),
    subclassId: z.string().nullable(),
    backgroundId: z.string().nullable(),
    level: z.number().int().min(1).max(20),
    classes: z.array(ClassLevelSchema).min(1),
  }),
  abilities: z.object({
    str: z.number().int().min(1).max(30),
    dex: z.number().int().min(1).max(30),
    con: z.number().int().min(1).max(30),
    int: z.number().int().min(1).max(30),
    wis: z.number().int().min(1).max(30),
    cha: z.number().int().min(1).max(30),
  }),
  proficiencies: z.object({
    savingThrows: z.array(abilityKeySchema),
    skills: z.array(skillKeySchema),
    skillOverrides: z.record(skillKeySchema, z.boolean()),
    languages: z.array(z.string()),
    armorProficiencies: z.array(z.string()),
    weaponProficiencies: z.array(z.string()),
    toolProficiencies: z.array(z.string()),
  }),
  combat: z.object({
    hpMax: z.number().int().min(1),
    hpCurrent: z.number().int().min(0),
    hpTemp: z.number().int().min(0),
    hitDiceTotal: z.number().int().min(0),
    hitDiceUsed: z.number().int().min(0),
    hitDie: z.string(),
    armorClassOverride: z.number().int().nullable(),
    initiativeOverride: z.number().int().nullable(),
    speedOverride: z.number().int().nullable(),
    inspiration: z.boolean(),
    conditionIds: z.array(conditionIdSchema),
    conditionsCustom: z.array(z.string()),
    exhaustionLevel: z.number().int().min(0).max(6),
    deathSaves: deathSavesSchema,
    damageResistances: z.array(z.string()),
    damageVulnerabilities: z.array(z.string()),
    damageImmunities: z.array(z.string()),
  }),
  equipment: z.object({
    armorId: z.string().nullable(),
    shieldEquipped: z.boolean(),
    currency: currencySchema,
    items: z.array(equipmentItemSchema),
  }),
  spells: z.object({
    abilityKey: abilityKeySchema.nullable(),
    cantripsKnown: z.array(z.string()),
    spellsKnown: z.array(z.string()),
    spellsPrepared: z.array(z.string()),
    spellSlotsUsed: spellSlotsUsedSchema,
    pactMagicUsed: z.number().int().min(0).nullable(),
    concentratingOn: z.string().nullable().default(null),
  }),
  resources: z.array(resourceSchema),
  feats: z.array(featSchema),
  roleplay: roleplaySchema,
  originChoices: z.object({
    species: z.record(z.string(), z.string()),
    background: z.record(z.string(), z.string()),
  }),
  notes: z.string(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;

export const TrackerExportSchema = z.object({
  nombre: z.string(),
  jugador: z.string(),
  nivel: z.number().int().min(1).max(20),
  hp_max: z.number().int().min(1),
  hp_actual: z.number().int(),
  ca: z.number().int().min(0),
  iniciativa: z.number().int(),
});

export type TrackerExport = z.infer<typeof TrackerExportSchema>;

export function currencyVacia(): CharacterCurrency {
  return { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
}

export function roleplayVacio(): CharacterRoleplay {
  return {
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    appearance: "",
  };
}

export function crearPersonajeVacio(input: {
  name: string;
  playerName: string;
  classId: string;
  speciesId?: string | null;
  level?: number;
}): Character {
  const now = new Date().toISOString();
  const level = input.level ?? 1;
  return {
    id: crypto.randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    meta: { createdAt: now, updatedAt: now },
    identity: {
      name: input.name,
      playerName: input.playerName,
      speciesId: input.speciesId ?? null,
      classId: input.classId,
      subclassId: null,
      backgroundId: null,
      level,
      classes: [{ classId: input.classId, subclassId: null, level }],
    },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencies: {
      savingThrows: [],
      skills: [],
      skillOverrides: {},
      languages: ["Común"],
      armorProficiencies: [],
      weaponProficiencies: [],
      toolProficiencies: [],
    },
    combat: {
      hpMax: 10,
      hpCurrent: 10,
      hpTemp: 0,
      hitDiceTotal: level,
      hitDiceUsed: 0,
      hitDie: "d8",
      armorClassOverride: null,
      initiativeOverride: null,
      speedOverride: null,
      inspiration: false,
      conditionIds: [],
      conditionsCustom: [],
      exhaustionLevel: 0,
      deathSaves: { successes: 0, failures: 0 },
      damageResistances: [],
      damageVulnerabilities: [],
      damageImmunities: [],
    },
    equipment: {
      armorId: null,
      shieldEquipped: false,
      currency: currencyVacia(),
      items: [],
    },
    spells: {
      abilityKey: null,
      cantripsKnown: [],
      spellsKnown: [],
      spellsPrepared: [],
      spellSlotsUsed: {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0,
      },
      pactMagicUsed: null,
      concentratingOn: null,
    },
    resources: [],
    feats: [],
    roleplay: roleplayVacio(),
    originChoices: { species: {}, background: {} },
    notes: "",
  };
}
