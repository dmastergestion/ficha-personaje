import type { ContentPack } from "@/schemas/content-pack";
import spellMetaJson from "@/data/srd/spell-meta.json";
import weaponMetaJson from "@/data/srd/weapon-meta.json";
import speciesMetaJson from "@/data/srd/species-meta.json";
import backgroundMetaJson from "@/data/srd/background-meta.json";
import phbManual from "@/data/i18n/phb-es-manual.json";
import {
  mergeConjurosCatalogo,
  conjuroRequiereConcentracion,
} from "@/rules/spell-meta";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import {
  i18n,
  srdArmor,
  srdBackgrounds,
  srdClasses,
  srdSpecies,
  srdSpells,
  srdSubclasses,
  srdWeapons,
  type I18nBundle,
  type SrdArmor,
  type SrdBackground,
  type SrdClass,
  type SrdSpecies,
  type SrdSpell,
  type SrdSubclass,
  type SrdWeapon,
} from "@/rules/srd";

export type TranslateCategory = keyof Omit<I18nBundle, "ui"> | "speciesGroups" | "feats";

type SpellMetaFile = Record<
  string,
  Partial<
    Pick<
      SrdSpell,
      | "castType"
      | "save"
      | "damage"
      | "castingTime"
      | "range"
      | "components"
      | "duration"
      | "ritual"
      | "description"
      | "areaTags"
    >
  >
>;
type WeaponMetaFile = Record<string, Partial<Pick<SrdWeapon, "versatileDamageDie" | "range">>>;
type SpeciesMetaFile = Record<
  string,
  Partial<Pick<SrdSpecies, "size" | "speed" | "skillProficiencies" | "traits">>
>;
type BackgroundMetaFile = Record<
  string,
  Partial<Pick<SrdBackground, "skillProficiencies" | "toolProficiencies" | "feat" | "traits">>
>;

const spellMeta = spellMetaJson as SpellMetaFile;
const weaponMeta = weaponMetaJson as WeaponMetaFile;
const speciesMeta = speciesMetaJson as SpeciesMetaFile;
const backgroundMeta = backgroundMetaJson as BackgroundMetaFile;

function mergeById<T extends { id: string }>(base: T[], extra: T[] | undefined): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  for (const item of extra ?? []) {
    map.set(item.id, item as T);
  }
  return [...map.values()];
}

function translate(
  category: TranslateCategory,
  id: string | null | undefined,
  fallback = "",
  pack: ContentPack | null,
): string {
  if (!id) return fallback;

  if (category === "speciesGroups") {
    const manual = phbManual.speciesGroups as Record<string, string> | undefined;
    return manual?.[id] ?? i18n.species[id] ?? fallback ?? id;
  }

  const manualCat = phbManual[category as keyof typeof phbManual] as
    | Record<string, string>
    | undefined;

  return (
    i18n[category as keyof Omit<I18nBundle, "ui">]?.[id] ??
    manualCat?.[id] ??
    pack?.i18nEs?.[category as keyof ContentPack["i18nEs"]]?.[id] ??
    fallback ??
    id
  );
}

function enrichSpell(spell: SrdSpell): SrdSpell {
  const meta = spellMeta[spell.id];
  if (!meta) return spell;
  return {
    ...spell,
    castType: spell.castType ?? meta.castType,
    save: spell.save ?? meta.save,
    damage: spell.damage ?? meta.damage,
    castingTime: spell.castingTime ?? meta.castingTime,
    range: spell.range ?? meta.range,
    components: spell.components ?? meta.components,
    duration: spell.duration ?? meta.duration,
    ritual: spell.ritual ?? meta.ritual,
    description: spell.description ?? meta.description,
    areaTags: spell.areaTags ?? meta.areaTags,
  };
}

function enrichWeapon(weapon: SrdWeapon): SrdWeapon {
  const meta = weaponMeta[weapon.id];
  if (!meta) return weapon;
  return {
    ...weapon,
    versatileDamageDie: weapon.versatileDamageDie ?? meta.versatileDamageDie,
    range: weapon.range ?? meta.range,
  };
}

function enrichSpecies(species: SrdSpecies): SrdSpecies {
  const groupId = inferSpeciesGroupId(species.id);
  const baseMeta = speciesMeta[groupId];
  const variantMeta = species.id !== groupId ? speciesMeta[species.id] : undefined;
  const meta = { ...baseMeta, ...variantMeta };
  if (!meta || Object.keys(meta).length === 0) return species;
  return {
    ...species,
    size: species.size ?? meta.size,
    speed: species.speed ?? meta.speed,
    skillProficiencies: species.skillProficiencies ?? meta.skillProficiencies,
    traits: species.traits ?? meta.traits,
  };
}

function enrichBackground(background: SrdBackground): SrdBackground {
  const meta = backgroundMeta[background.id];
  if (!meta) return background;
  return {
    ...background,
    skillProficiencies: background.skillProficiencies ?? meta.skillProficiencies,
    toolProficiencies: background.toolProficiencies ?? meta.toolProficiencies,
    feat: background.feat ?? meta.feat,
    traits: background.traits ?? meta.traits,
  };
}

export interface GameCatalog {
  pack: ContentPack | null;
  classes: SrdClass[];
  subclasses: SrdSubclass[];
  species: SrdSpecies[];
  backgrounds: SrdBackground[];
  spells: SrdSpell[];
  weapons: SrdWeapon[];
  armor: SrdArmor[];
  t: (category: TranslateCategory, id: string | null | undefined, fallback?: string) => string;
  requiereConcentracion: (spellId: string) => boolean;
  obtenerConjuro: (spellId: string) => SrdSpell | undefined;
  obtenerEspecie: (speciesId: string) => SrdSpecies | undefined;
  obtenerTrasfondo: (backgroundId: string) => SrdBackground | undefined;
}

export function buildCatalog(pack: ContentPack | null): GameCatalog {
  const packSpells: SrdSpell[] =
    pack?.spells.map((s) => ({
      id: s.id,
      srdId: s.externalId ?? s.id,
      nameEn: s.nameEn,
      level: s.level,
      school: s.school,
      concentration: s.concentration === true,
      castType: s.castType,
      save: s.save,
      damage: s.damage,
      castingTime: s.castingTime,
      range: s.range,
      components: s.components,
      duration: s.duration,
      ritual: s.ritual,
      description: s.description,
      areaTags: s.areaTags,
    })) ?? [];

  const packClasses = pack?.classes.map((c) => ({ ...c, srdId: c.externalId ?? c.id })) ?? [];
  const packSubclasses =
    pack?.subclasses.map((s) => ({ ...s, srdId: s.externalId ?? s.id })) ?? [];
  const packSpecies: SrdSpecies[] =
    pack?.species.map((s) => ({
      id: s.id,
      srdId: s.externalId ?? s.id,
      nameEn: s.nameEn,
      size: s.size,
      speed: s.speed,
      skillProficiencies: s.skillProficiencies,
      traits: s.traits,
    })) ?? [];
  const packBackgrounds: SrdBackground[] =
    pack?.backgrounds.map((b) => ({
      id: b.id,
      srdId: b.externalId ?? b.id,
      nameEn: b.nameEn,
      skillProficiencies: b.skillProficiencies,
      toolProficiencies: b.toolProficiencies,
      feat: b.feat,
      traits: b.traits,
    })) ?? [];
  const packWeapons: SrdWeapon[] =
    pack?.weapons.map((w) => ({
      id: w.id,
      srdId: w.externalId ?? w.id,
      nameEn: w.nameEn,
      category: w.category,
      damageDie: w.damageDie,
      damageType: w.damageType,
      abilityKey: w.abilityKey,
      weightLb: w.weightLb,
      properties: w.properties,
      versatileDamageDie: w.versatileDamageDie,
      range: w.range,
    })) ?? [];
  const packArmor = pack?.armor.map((a) => ({ ...a, srdId: a.externalId ?? a.id })) ?? [];

  const spells = mergeConjurosCatalogo(srdSpells, packSpells).map(enrichSpell);
  const weapons = mergeById(srdWeapons, packWeapons).map(enrichWeapon);
  const species = mergeById(srdSpecies, packSpecies).map(enrichSpecies);
  const backgrounds = mergeById(srdBackgrounds, packBackgrounds).map(enrichBackground);

  const catalog: GameCatalog = {
    pack,
    classes: mergeById(srdClasses, packClasses as SrdClass[]),
    subclasses: mergeById(srdSubclasses, packSubclasses as SrdSubclass[]),
    species,
    backgrounds,
    spells,
    weapons,
    armor: mergeById(srdArmor, packArmor as SrdArmor[]),
    t(category, id, fallback = "") {
      return translate(category, id, fallback, pack);
    },
    requiereConcentracion(spellId) {
      return conjuroRequiereConcentracion(spellId, spells.find((s) => s.id === spellId));
    },
    obtenerConjuro(spellId) {
      return spells.find((s) => s.id === spellId);
    },
    obtenerEspecie(speciesId) {
      const found = species.find((s) => s.id === speciesId);
      if (found) return found;
      const groupId = inferSpeciesGroupId(speciesId);
      if (groupId === speciesId) return undefined;
      const base = species.find((s) => s.id === groupId);
      if (!base) return undefined;
      return enrichSpecies({ ...base, id: speciesId });
    },
    obtenerTrasfondo(backgroundId) {
      return backgrounds.find((b) => b.id === backgroundId);
    },
  };

  catalog.species.sort((a, b) =>
    catalog.t("species", a.id, a.nameEn).localeCompare(catalog.t("species", b.id, b.nameEn), "es"),
  );
  catalog.backgrounds.sort((a, b) =>
    catalog
      .t("backgrounds", a.id, a.nameEn)
      .localeCompare(catalog.t("backgrounds", b.id, b.nameEn), "es"),
  );

  return catalog;
}

export const defaultCatalog = buildCatalog(null);
