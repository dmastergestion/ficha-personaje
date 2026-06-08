import { z } from "zod";
import {
  ABILITY_KEYS,
  SKILL_KEYS,
  SPELL_SLOT_LEVELS,
} from "@/lib/constants";
import { CharacterSchema, type Character } from "@/schemas/character";

/** Schema v1 para importar backups antiguos. */
const CharacterSchemaV1 = z.object({
  id: z.string().uuid(),
  schemaVersion: z.literal(1),
  meta: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  identity: z.object({
    name: z.string().min(1),
    playerName: z.string(),
    speciesId: z.string().nullable(),
    classId: z.string().min(1),
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
    savingThrows: z.array(z.enum(ABILITY_KEYS)),
    skills: z.array(z.enum(SKILL_KEYS)),
    skillOverrides: z.record(z.enum(SKILL_KEYS), z.boolean()),
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
    abilityKey: z.enum(ABILITY_KEYS).nullable(),
    cantripsKnown: z.array(z.string()),
    spellsKnown: z.array(z.string()),
    spellsPrepared: z.array(z.string()),
    spellSlotsUsed: z.object(
      Object.fromEntries(SPELL_SLOT_LEVELS.map((n) => [n, z.number().int().min(0)])) as Record<
        (typeof SPELL_SLOT_LEVELS)[number],
        z.ZodNumber
      >,
    ),
    pactMagicUsed: z.number().int().min(0).nullable(),
  }),
  notes: z.string(),
});

export function migrarPersonajeV1(raw: unknown): Character {
  const v1 = CharacterSchemaV1.parse(raw);
  const { conditions, ...combatRest } = v1.combat;

  return CharacterSchema.parse({
    ...v1,
    schemaVersion: 2,
    combat: {
      ...combatRest,
      conditionIds: [],
      conditionsCustom: conditions,
      exhaustionLevel: 0,
    },
    equipment: {
      ...v1.equipment,
      items: v1.equipment.items.map((item) => ({
        ...item,
        weightLb: 0,
      })),
    },
  });
}

export function normalizarPersonaje(raw: unknown): Character {
  const v2 = CharacterSchema.safeParse(raw);
  if (v2.success) return v2.data;

  const asRecord = raw as { schemaVersion?: number } | null;
  if (asRecord?.schemaVersion === 1) {
    return migrarPersonajeV1(raw);
  }

  throw new Error("Formato de personaje no reconocido");
}

/** Migración in-place para registros Dexie v1. */
export function migrarRegistroDexieV1(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 1) return;

  const combat = char.combat as Record<string, unknown>;
  combat.conditionIds = [];
  combat.conditionsCustom = combat.conditions ?? [];
  combat.exhaustionLevel = 0;
  delete combat.conditions;

  const equipment = char.equipment as { items?: Record<string, unknown>[] };
  equipment.items = (equipment.items ?? []).map((item) => ({
    ...item,
    weightLb: item.weightLb ?? 0,
  }));

  char.schemaVersion = 2;
}
