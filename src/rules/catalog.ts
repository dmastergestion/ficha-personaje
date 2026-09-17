import type { ContentPack } from "@/schemas/content-pack";
import spellMetaJson from "@/data/srd/spell-meta.json";
import weaponMetaJson from "@/data/srd/weapon-meta.json";
import speciesMetaJson from "@/data/srd/species-meta.json";
import backgroundMetaJson from "@/data/srd/background-meta.json";
import phbManual from "@/data/i18n/phb-es-manual.json";
import { idSrdConjuro, idsEquivalentesConjuro } from "@/rules/spell-aliases";
import {
  mergeConjurosCatalogo,
  conjuroEsRitual,
  conjuroRequiereConcentracion,
} from "@/rules/spell-meta";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import { SUBCLASS_ID_ALIASES } from "@/rules/class-features";
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
import { compararConjurosPorNivel } from "@/rules/spells";

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

function idSubclaseCanonico(id: string): string {
  if (id === "open-hand") return "hand";
  return id;
}

function idsOcupados(id: string, aliases: (id: string) => string[]): string[] {
  return [...new Set([id, ...aliases(id)])];
}

/** Añade solo ids nuevos. No sustituye el PHB embebido ni duplica alias (hand/open-hand). */
function fusionarSinDuplicar<T extends { id: string }>(
  base: T[],
  extra: T[] | undefined,
  aliases: (id: string) => string[] = (id) => [id],
): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  const ocupados = new Set(base.flatMap((item) => idsOcupados(item.id, aliases)));
  for (const item of extra ?? []) {
    if (idsOcupados(item.id, aliases).some((id) => ocupados.has(id))) continue;
    map.set(item.id, item);
    for (const id of idsOcupados(item.id, aliases)) ocupados.add(id);
  }
  return [...map.values()];
}

function fusionarEspecies(
  base: SrdSpecies[],
  extra: SrdSpecies[] | undefined,
): SrdSpecies[] {
  const gruposConVariante = new Set(
    base
      .map((s) => inferSpeciesGroupId(s.id))
      .filter((grupo) => base.some((s) => inferSpeciesGroupId(s.id) === grupo && s.id !== grupo)),
  );
  const ocupados = new Set(base.map((s) => s.id));
  const out = [...base];
  for (const item of extra ?? []) {
    if (ocupados.has(item.id)) continue;
    const grupo = inferSpeciesGroupId(item.id);
    if (item.id === grupo && gruposConVariante.has(grupo)) continue;
    ocupados.add(item.id);
    out.push(item);
  }
  return out;
}

function aliasesSubclase(id: string): string[] {
  return [idSubclaseCanonico(id), ...(SUBCLASS_ID_ALIASES[id] ?? [])];
}

function translate(
  category: TranslateCategory,
  id: string | null | undefined,
  fallback = "",
  pack: ContentPack | null,
): string {
  if (!id) return fallback;

  const ids =
    category === "spells"
      ? idsEquivalentesConjuro(id)
      : category === "subclasses"
        ? [id, ...(SUBCLASS_ID_ALIASES[id] ?? [])]
        : [id];

  if (category === "speciesGroups") {
    const manual = phbManual.speciesGroups as Record<string, string> | undefined;
    return manual?.[id] ?? i18n.species[id] ?? fallback ?? id;
  }

  const manualCat = phbManual[category as keyof typeof phbManual] as
    | Record<string, string>
    | undefined;

  for (const lookupId of ids) {
    const translated =
      manualCat?.[lookupId] ??
      i18n[category as keyof Omit<I18nBundle, "ui">]?.[lookupId] ??
      pack?.i18nEs?.[category as keyof ContentPack["i18nEs"]]?.[lookupId];
    if (translated) return translated;
  }

  return fallback || id;
}

function enrichSpell(spell: SrdSpell): SrdSpell {
  const srdId = idSrdConjuro(spell.id);
  const meta = spellMeta[spell.id] ?? (srdId ? spellMeta[srdId] : undefined);
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
  esRitual: (spellId: string) => boolean;
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
    pack?.subclasses.map((s) => ({
      ...s,
      id: idSubclaseCanonico(s.id),
      srdId: s.externalId ?? s.id,
    })) ?? [];
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
  const weapons = fusionarSinDuplicar(srdWeapons, packWeapons).map(enrichWeapon);
  const species = fusionarEspecies(srdSpecies, packSpecies).map(enrichSpecies);
  const backgrounds = fusionarSinDuplicar(srdBackgrounds, packBackgrounds).map(enrichBackground);

  const catalog: GameCatalog = {
    pack,
    classes: fusionarSinDuplicar(srdClasses, packClasses as SrdClass[]),
    subclasses: fusionarSinDuplicar(
      srdSubclasses,
      packSubclasses as SrdSubclass[],
      aliasesSubclase,
    ),
    species,
    backgrounds,
    spells,
    weapons,
    armor: fusionarSinDuplicar(srdArmor, packArmor as SrdArmor[]),
    t(category, id, fallback = "") {
      return translate(category, id, fallback, pack);
    },
    requiereConcentracion(spellId) {
      return conjuroRequiereConcentracion(spellId, buscarConjuro(spells, spellId));
    },
    esRitual(spellId) {
      return conjuroEsRitual(spellId, buscarConjuro(spells, spellId));
    },
    obtenerConjuro(spellId) {
      return buscarConjuro(spells, spellId);
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
  catalog.spells.sort((a, b) =>
    compararConjurosPorNivel(
      a.level,
      catalog.t("spells", a.id, a.nameEn),
      b.level,
      catalog.t("spells", b.id, b.nameEn),
    ),
  );

  return catalog;
}

export const defaultCatalog = buildCatalog(null);

export interface ResumenPackNuevo {
  spells: number;
  subclasses: number;
  species: number;
  backgrounds: number;
  classes: number;
  weapons: number;
  armor: number;
}

/** Cuántas entradas nuevas aporta un pack respecto al PHB embebido. */
export function resumenPackNuevo(pack: ContentPack): ResumenPackNuevo {
  const merged = buildCatalog(pack);
  return {
    spells: merged.spells.length - defaultCatalog.spells.length,
    subclasses: merged.subclasses.length - defaultCatalog.subclasses.length,
    species: merged.species.length - defaultCatalog.species.length,
    backgrounds: merged.backgrounds.length - defaultCatalog.backgrounds.length,
    classes: merged.classes.length - defaultCatalog.classes.length,
    weapons: merged.weapons.length - defaultCatalog.weapons.length,
    armor: merged.armor.length - defaultCatalog.armor.length,
  };
}

function buscarConjuro(spells: SrdSpell[], spellId: string): SrdSpell | undefined {
  for (const id of idsEquivalentesConjuro(spellId)) {
    const found = spells.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}
