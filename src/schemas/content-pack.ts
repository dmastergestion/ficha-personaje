import { z } from "zod";

const CatalogEntrySchema = z.object({
  id: z.string(),
  externalId: z.string().optional(),
  nameEn: z.string(),
});

const SpellDamageSchema = z.object({
  dice: z.string(),
  type: z.string().optional(),
  scalePerSlot: z.string().optional(),
  cantripScaling: z.boolean().optional(),
});

const SpellEntrySchema = CatalogEntrySchema.extend({
  level: z.number().int().min(0).max(9),
  school: z.string(),
  concentration: z.boolean().optional(),
  castType: z.enum(["attack", "save", "none"]).optional(),
  save: z.enum(["str", "dex", "con", "int", "wis", "cha"]).optional(),
  damage: SpellDamageSchema.optional(),
  castingTime: z.string().optional(),
  range: z.string().optional(),
  components: z.string().optional(),
  duration: z.string().optional(),
  ritual: z.boolean().optional(),
  description: z.string().optional(),
  areaTags: z.array(z.string()).optional(),
});

const ClassEntrySchema = CatalogEntrySchema.extend({
  hitDie: z.string(),
  primaryAbilities: z.array(z.enum(["str", "dex", "con", "int", "wis", "cha"])),
});

const SubclassEntrySchema = CatalogEntrySchema.extend({
  classId: z.string(),
});

const WeaponEntrySchema = CatalogEntrySchema.extend({
  category: z.string(),
  damageDie: z.string(),
  damageType: z.string(),
  abilityKey: z.enum(["str", "dex", "con", "int", "wis", "cha"]),
  weightLb: z.number(),
  properties: z.array(z.string()),
  versatileDamageDie: z.string().optional(),
  range: z.string().optional(),
});

const ArmorEntrySchema = CatalogEntrySchema.extend({
  category: z.enum(["light", "medium", "heavy", "shield"]),
  baseAc: z.number(),
  dexMax: z.number().nullable(),
  strengthMin: z.number().nullable(),
  stealthDisadvantage: z.boolean(),
});

const SpeciesEntrySchema = CatalogEntrySchema.extend({
  size: z.string().optional(),
  speed: z.number().optional(),
  skillProficiencies: z.array(z.string()).optional(),
  traits: z.string().optional(),
});

const BackgroundEntrySchema = CatalogEntrySchema.extend({
  skillProficiencies: z.array(z.string()).optional(),
  toolProficiencies: z.array(z.string()).optional(),
  feat: z.string().optional(),
  traits: z.string().optional(),
});

export const ContentPackSchema = z.object({
  version: z.literal(1),
  source: z.string(),
  from: z.string(),
  generatedAt: z.string(),
  counts: z.object({
    spells: z.number(),
    classes: z.number(),
    subclasses: z.number(),
    species: z.number(),
    backgrounds: z.number(),
    weapons: z.number(),
    armor: z.number(),
  }),
  spells: z.array(SpellEntrySchema),
  classes: z.array(ClassEntrySchema),
  subclasses: z.array(SubclassEntrySchema),
  species: z.array(SpeciesEntrySchema),
  backgrounds: z.array(BackgroundEntrySchema),
  weapons: z.array(WeaponEntrySchema),
  armor: z.array(ArmorEntrySchema),
  i18nEs: z.object({
    spells: z.record(z.string()),
    classes: z.record(z.string()),
    subclasses: z.record(z.string()),
    species: z.record(z.string()),
    backgrounds: z.record(z.string()),
    weapons: z.record(z.string()),
    armor: z.record(z.string()),
  }),
});

export type ContentPack = z.infer<typeof ContentPackSchema>;
