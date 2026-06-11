import { z } from "zod";
import {
  ABILITY_KEYS,
  SKILL_KEYS,
  SPELL_SLOT_LEVELS,
} from "@/lib/constants";
import { CONDITION_IDS } from "@/lib/conditions";
import {
  CharacterSchema,
  combatAttackSchema,
  currencyVacia,
  roleplayVacio,
  type Character,
} from "@/schemas/character";
import { obtenerArma } from "@/rules/srd";
import { sanitizarRecursos } from "@/rules/resources";

type AtaqueLegacy = {
  id: string;
  name?: string;
  weaponId?: string | null;
  magicBonus?: number;
  abilityKey?: string;
  proficient?: boolean;
  damage?: string;
  notes?: string;
};

function ataquesAItemsInventario(attacks: AtaqueLegacy[]) {
  return attacks.map((attack) => ({
    id: attack.id,
    name: attack.name ?? "",
    qty: 1,
    weightLb:
      attack.weaponId && typeof attack.weaponId === "string"
        ? (obtenerArma(attack.weaponId)?.weightLb ?? 0)
        : 0,
    weaponId: attack.weaponId ?? null,
    magicBonus: attack.magicBonus ?? 0,
    abilityKey: attack.abilityKey,
    proficient: attack.proficient,
    damage: attack.damage,
    notes: attack.notes,
  }));
}

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

const CharacterSchemaV2 = CharacterSchemaV1.extend({
  schemaVersion: z.literal(2),
  combat: CharacterSchemaV1.shape.combat.omit({ conditions: true }).extend({
    conditionIds: z.array(z.enum(CONDITION_IDS)),
    conditionsCustom: z.array(z.string()),
    exhaustionLevel: z.number().int().min(0).max(6),
  }),
  equipment: CharacterSchemaV1.shape.equipment.extend({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        qty: z.number().int().min(0),
        weightLb: z.number().min(0),
        notes: z.string().optional(),
      }),
    ),
  }),
});

const CharacterSchemaV3 = CharacterSchemaV2.extend({
  schemaVersion: z.literal(3),
  identity: CharacterSchemaV2.shape.identity.extend({
    classes: z
      .array(
        z.object({
          classId: z.string().min(1),
          subclassId: z.string().nullable(),
          level: z.number().int().min(1).max(20),
        }),
      )
      .min(1),
  }),
});

const CharacterSchemaV4 = CharacterSchemaV3.extend({
  schemaVersion: z.literal(4),
  identity: CharacterSchemaV3.shape.identity,
  combat: CharacterSchemaV3.shape.combat.extend({
    attacks: z.array(combatAttackSchema),
  }),
});

const CharacterSchemaV5 = CharacterSchemaV4.omit({ schemaVersion: true, combat: true }).extend({
  schemaVersion: z.literal(5),
  combat: CharacterSchemaV4.shape.combat.omit({ attacks: true }),
});

export function defaultsV6(char: z.infer<typeof CharacterSchemaV5>): Character {
  const prof = char.proficiencies as z.infer<typeof CharacterSchemaV5>["proficiencies"] & {
    languages?: string[];
    armorProficiencies?: string[];
    weaponProficiencies?: string[];
    toolProficiencies?: string[];
  };
  const combat = char.combat as z.infer<typeof CharacterSchemaV5>["combat"] & {
    deathSaves?: { successes: number; failures: number };
    damageResistances?: string[];
    damageVulnerabilities?: string[];
    damageImmunities?: string[];
  };
  const equipment = char.equipment as z.infer<typeof CharacterSchemaV5>["equipment"] & {
    currency?: ReturnType<typeof currencyVacia>;
    items: Array<
      z.infer<typeof CharacterSchemaV5>["equipment"]["items"][number] & {
        attuned?: boolean;
        requiresAttunement?: boolean;
      }
    >;
  };
  const extra = char as {
    resources?: Character["resources"];
    feats?: Character["feats"];
    roleplay?: Character["roleplay"];
  };

  return CharacterSchema.parse({
    ...char,
    schemaVersion: 6,
    proficiencies: {
      ...prof,
      languages: prof.languages ?? ["Común"],
      armorProficiencies: prof.armorProficiencies ?? [],
      weaponProficiencies: prof.weaponProficiencies ?? [],
      toolProficiencies: prof.toolProficiencies ?? [],
    },
    combat: {
      ...combat,
      deathSaves: combat.deathSaves ?? { successes: 0, failures: 0 },
      damageResistances: combat.damageResistances ?? [],
      damageVulnerabilities: combat.damageVulnerabilities ?? [],
      damageImmunities: combat.damageImmunities ?? [],
    },
    equipment: {
      ...equipment,
      currency: equipment.currency ?? currencyVacia(),
      items: equipment.items.map((item) => {
        const extra = item as typeof item & {
          attuned?: boolean;
          requiresAttunement?: boolean;
        };
        return {
          ...item,
          attuned: extra.attuned ?? false,
          requiresAttunement: extra.requiresAttunement ?? false,
        };
      }),
    },
    resources: extra.resources ?? [],
    feats: extra.feats ?? [],
    roleplay: extra.roleplay ?? roleplayVacio(),
  });
}

export function migrarPersonajeV2(raw: unknown): Character {
  const v2 = CharacterSchemaV2.parse(raw);
  return migrarPersonajeV3({
    ...v2,
    schemaVersion: 3,
    identity: {
      ...v2.identity,
      classes: [
        {
          classId: v2.identity.classId,
          subclassId: v2.identity.subclassId,
          level: v2.identity.level,
        },
      ],
    },
  });
}

export function migrarPersonajeV3(raw: unknown): Character {
  const v3 = CharacterSchemaV3.parse(raw);
  return migrarPersonajeV4({
    ...v3,
    schemaVersion: 4,
    combat: {
      ...v3.combat,
      attacks: [],
    },
  });
}

export function migrarPersonajeV4(raw: unknown): Character {
  const v4 = CharacterSchemaV4.parse(raw);
  const { attacks, ...combatRest } = v4.combat;
  const attackItems = ataquesAItemsInventario(attacks);

  return defaultsV6({
    ...v4,
    schemaVersion: 5,
    combat: combatRest,
    equipment: {
      ...v4.equipment,
      items: [...v4.equipment.items, ...attackItems],
    },
  } as z.infer<typeof CharacterSchemaV5>);
}

export function migrarPersonajeV5(raw: unknown): Character {
  const v5 = CharacterSchemaV5.parse(raw);
  return defaultsV6(v5);
}

export function migrarPersonajeV1(raw: unknown): Character {
  const v1 = CharacterSchemaV1.parse(raw);
  const { conditions, ...combatRest } = v1.combat;

  return migrarPersonajeV2({
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
  const v6 = CharacterSchema.safeParse(raw);
  if (v6.success) return sanitizarRecursos(v6.data);

  const asRecord = raw as { schemaVersion?: number } | null;
  if (asRecord?.schemaVersion === 5) return sanitizarRecursos(migrarPersonajeV5(raw));
  if (asRecord?.schemaVersion === 4) return sanitizarRecursos(migrarPersonajeV4(raw));
  if (asRecord?.schemaVersion === 3) return sanitizarRecursos(migrarPersonajeV3(raw));
  if (asRecord?.schemaVersion === 2) return sanitizarRecursos(migrarPersonajeV2(raw));
  if (asRecord?.schemaVersion === 1) return sanitizarRecursos(migrarPersonajeV1(raw));

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

export function migrarRegistroDexieV2(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 2) return;

  const identity = char.identity as Record<string, unknown>;
  identity.classes = [
    {
      classId: identity.classId,
      subclassId: identity.subclassId ?? null,
      level: identity.level,
    },
  ];

  char.schemaVersion = 3;
}

export function migrarRegistroDexieV3(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 3) return;

  const combat = char.combat as Record<string, unknown>;
  combat.attacks = [];

  char.schemaVersion = 4;
}

export function migrarRegistroDexieV4(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 4) return;

  const combat = char.combat as Record<string, unknown> & {
    attacks?: Array<Record<string, unknown>>;
  };
  const attacks = (combat.attacks ?? []) as AtaqueLegacy[];
  delete combat.attacks;

  const equipment = char.equipment as { items?: Record<string, unknown>[] };
  equipment.items = [...(equipment.items ?? []), ...ataquesAItemsInventario(attacks)];
  char.schemaVersion = 5;
}

export function migrarRegistroDexieV5(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 5) return;

  const proficiencies = char.proficiencies as Record<string, unknown>;
  proficiencies.languages = proficiencies.languages ?? ["Común"];
  proficiencies.armorProficiencies = proficiencies.armorProficiencies ?? [];
  proficiencies.weaponProficiencies = proficiencies.weaponProficiencies ?? [];
  proficiencies.toolProficiencies = proficiencies.toolProficiencies ?? [];

  const combat = char.combat as Record<string, unknown>;
  combat.deathSaves = combat.deathSaves ?? { successes: 0, failures: 0 };
  combat.damageResistances = combat.damageResistances ?? [];
  combat.damageVulnerabilities = combat.damageVulnerabilities ?? [];
  combat.damageImmunities = combat.damageImmunities ?? [];

  const equipment = char.equipment as {
    currency?: Record<string, number>;
    items?: Record<string, unknown>[];
  };
  equipment.currency = equipment.currency ?? { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
  equipment.items = (equipment.items ?? []).map((item) => ({
    ...item,
    attuned: item.attuned ?? false,
    requiresAttunement: item.requiresAttunement ?? false,
  }));

  char.resources = char.resources ?? [];
  char.feats = char.feats ?? [];
  char.roleplay = char.roleplay ?? {
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    appearance: "",
  };

  char.schemaVersion = 6;
}
