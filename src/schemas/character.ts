import { z } from "zod";
import {
  ABILITY_KEYS,
  SCHEMA_VERSION,
  SKILL_KEYS,
  SPELL_SLOT_LEVELS,
} from "@/lib/constants";

const abilityKeySchema = z.enum(ABILITY_KEYS);
const skillKeySchema = z.enum(SKILL_KEYS);

const spellSlotsUsedSchema = z.object(
  Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, z.number().int().min(0)])) as Record<
    (typeof SPELL_SLOT_LEVELS)[number],
    z.ZodNumber
  >,
);

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
  }),
  combat: z.object({
    hpMax: z.number().int().min(1),
    hpCurrent: z.number().int(),
    hpTemp: z.number().int().min(0),
    hitDiceTotal: z.number().int().min(0),
    hitDiceUsed: z.number().int().min(0),
    hitDie: z.string(),
    armorClassOverride: z.number().int().nullable(),
    initiativeOverride: z.number().int().nullable(),
    speedOverride: z.number().int().nullable(),
    inspiration: z.boolean(),
    conditions: z.array(z.string()),
  }),
  equipment: z.object({
    armorId: z.string().nullable(),
    shieldEquipped: z.boolean(),
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        qty: z.number().int().min(0),
        notes: z.string().optional(),
      }),
    ),
  }),
  spells: z.object({
    abilityKey: abilityKeySchema.nullable(),
    cantripsKnown: z.array(z.string()),
    spellsKnown: z.array(z.string()),
    spellsPrepared: z.array(z.string()),
    spellSlotsUsed: spellSlotsUsedSchema,
    pactMagicUsed: z.number().int().min(0).nullable(),
  }),
  notes: z.string(),
});

export type Character = z.infer<typeof CharacterSchema>;

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

export function crearPersonajeVacio(input: {
  name: string;
  playerName: string;
  classId: string;
  speciesId?: string | null;
  level?: number;
}): Character {
  const now = new Date().toISOString();
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
      level: input.level ?? 1,
    },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencies: {
      savingThrows: [],
      skills: [],
      skillOverrides: {},
    },
    combat: {
      hpMax: 10,
      hpCurrent: 10,
      hpTemp: 0,
      hitDiceTotal: input.level ?? 1,
      hitDiceUsed: 0,
      hitDie: "d8",
      armorClassOverride: null,
      initiativeOverride: null,
      speedOverride: null,
      inspiration: false,
      conditions: [],
    },
    equipment: {
      armorId: null,
      shieldEquipped: false,
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
    },
    notes: "",
  };
}
