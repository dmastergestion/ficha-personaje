import type { AbilityKey } from "@/lib/constants";
import classesData from "@/data/srd/classes.json";
import subclassesData from "@/data/srd/subclasses.json";
import armorData from "@/data/srd/armor.json";
import weaponsData from "@/data/srd/weapons.json";
import spellsData from "@/data/srd/spells.json";
import speciesData from "@/data/srd/species.json";
import backgroundsData from "@/data/srd/backgrounds.json";
import i18nData from "@/data/i18n/es.json";

export interface SrdClass {
  id: string;
  srdId: string;
  nameEn: string;
  hitDie: string;
  primaryAbilities: AbilityKey[];
}

export interface SrdArmor {
  id: string;
  srdId: string;
  nameEn: string;
  category: "light" | "medium" | "heavy" | "shield";
  baseAc: number;
  dexMax: number | null;
  strengthMin: number | null;
}

export interface SrdWeapon {
  id: string;
  srdId: string;
  nameEn: string;
  category: string;
  damageDie: string;
  damageType: string;
  abilityKey: AbilityKey;
  weightLb: number;
  properties: string[];
  versatileDamageDie?: string;
  range?: string;
}

export interface SrdSpell {
  id: string;
  srdId: string;
  nameEn: string;
  level: number;
  school: string;
  concentration?: boolean;
  castType?: "attack" | "save" | "none";
  save?: AbilityKey;
  damage?: {
    dice: string;
    type?: string;
    scalePerSlot?: string;
    cantripScaling?: boolean;
  };
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  ritual?: boolean;
  description?: string;
  areaTags?: string[];
}

export interface SrdEntry {
  id: string;
  srdId: string;
  nameEn: string;
}

export interface SrdSpecies extends SrdEntry {
  size?: string;
  speed?: number;
  skillProficiencies?: string[];
  traits?: string;
}

export interface SrdBackground extends SrdEntry {
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  feat?: string;
  traits?: string;
}

export interface SrdSubclass extends SrdEntry {
  classId: string;
}

export interface I18nBundle {
  classes: Record<string, string>;
  subclasses: Record<string, string>;
  armor: Record<string, string>;
  weapons: Record<string, string>;
  spells: Record<string, string>;
  species: Record<string, string>;
  backgrounds: Record<string, string>;
  feats: Record<string, string>;
  ui: Record<string, string>;
}

export const WEAPON_CATEGORY_LABELS: Record<string, string> = {
  simpleM: "Simples · cuerpo a cuerpo",
  martialM: "Marciales · cuerpo a cuerpo",
  simpleR: "Simples · a distancia",
  martialR: "Marciales · a distancia",
};

export const srdClasses = classesData as SrdClass[];
export const srdSubclasses = subclassesData as SrdSubclass[];
export const srdArmor = armorData as SrdArmor[];
export const srdWeapons = weaponsData as SrdWeapon[];
export const srdSpells = spellsData as SrdSpell[];
export const srdSpecies = speciesData as SrdSpecies[];
export const srdBackgrounds = backgroundsData as SrdBackground[];
export const i18n = i18nData as I18nBundle;

export function obtenerClase(id: string): SrdClass | undefined {
  return srdClasses.find((c) => c.id === id);
}

export function obtenerArmadura(id: string | null): SrdArmor | undefined {
  if (!id) return undefined;
  return srdArmor.find((a) => a.id === id);
}

export function obtenerArma(id: string | null | undefined): SrdWeapon | undefined {
  if (!id) return undefined;
  return srdWeapons.find((w) => w.id === id);
}

export function t(
  category: keyof Omit<I18nBundle, "ui">,
  id: string | null | undefined,
  fallback = "",
): string {
  if (!id) return fallback;
  return i18n[category][id] ?? fallback ?? id;
}

export function tu(key: string, fallback = ""): string {
  return i18n.ui[key] ?? fallback ?? key;
}
