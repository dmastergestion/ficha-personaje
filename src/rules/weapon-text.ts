import weaponMetaJson from "@/data/srd/weapon-meta.json";
import { traducirAlcanceConjuro } from "@/lib/rules-text-polish";
import { ABILITY_LABELS_ES } from "@/rules/character";
import {
  obtenerArma,
  t,
  WEAPON_CATEGORY_LABELS,
  type SrdWeapon,
} from "@/rules/srd";

const DAMAGE_TYPE_ES: Record<string, string> = {
  slashing: "cortante",
  piercing: "perforante",
  bludgeoning: "contundente",
};

const WEAPON_PROPERTY_ES: Record<string, string> = {
  fin: "Sutil (DES o FUE)",
  lgt: "Ligera",
  thr: "Arrojadiza",
  ver: "Versátil",
  two: "Dos manos",
  amm: "Munición",
  hvy: "Pesada",
  reach: "Alcance",
  ld: "Recarga lenta",
  sil: "Sigilosa",
};

export function etiquetaTipoDanoArma(type: string): string {
  return DAMAGE_TYPE_ES[type.toLowerCase()] ?? type;
}

export function etiquetaPropiedadArma(code: string): string {
  return WEAPON_PROPERTY_ES[code.toLowerCase()] ?? code;
}

export function enrichWeaponMeta(weapon: SrdWeapon): SrdWeapon {
  const meta = (weaponMetaJson as Record<string, Partial<SrdWeapon>>)[weapon.id];
  if (!meta) return weapon;
  return {
    ...weapon,
    versatileDamageDie: weapon.versatileDamageDie ?? meta.versatileDamageDie,
    range: weapon.range ?? meta.range,
  };
}

export function filasInfoArma(weapon: SrdWeapon): { label: string; value: string }[] {
  const w = enrichWeaponMeta(weapon);
  const rows: { label: string; value: string }[] = [
    { label: "Categoría", value: WEAPON_CATEGORY_LABELS[w.category] ?? w.category },
    {
      label: "Daño",
      value: `${w.damageDie} ${etiquetaTipoDanoArma(w.damageType)}`,
    },
    { label: "Atributo", value: ABILITY_LABELS_ES[w.abilityKey] },
    { label: "Peso", value: `${w.weightLb} lb` },
  ];

  if (w.versatileDamageDie) {
    rows.push({ label: "Versátil", value: w.versatileDamageDie });
  }
  if (w.range) {
    const alcance = traducirAlcanceConjuro(w.range) ?? w.range;
    rows.push({ label: "Alcance", value: alcance });
  }
  if (w.properties.length > 0) {
    rows.push({
      label: "Propiedades",
      value: w.properties.map(etiquetaPropiedadArma).join(", "),
    });
  }

  return rows;
}

export function resumenArmaTooltip(weapon: SrdWeapon): string {
  const w = enrichWeaponMeta(weapon);
  const parts = [
    `${w.damageDie} ${etiquetaTipoDanoArma(w.damageType)}`,
    ABILITY_LABELS_ES[w.abilityKey],
  ];
  if (w.range) {
    parts.push(`alcance ${traducirAlcanceConjuro(w.range) ?? w.range}`);
  }
  if (w.properties.length > 0) {
    parts.push(w.properties.map(etiquetaPropiedadArma).join(", "));
  }
  return parts.join(" · ");
}

export function infoArmaPorId(weaponId: string | null | undefined): {
  weapon: SrdWeapon;
  name: string;
  tip: string;
  rows: { label: string; value: string }[];
} | null {
  if (!weaponId) return null;
  const weapon = obtenerArma(weaponId);
  if (!weapon) return null;
  return {
    weapon,
    name: t("weapons", weapon.id, weapon.nameEn),
    tip: resumenArmaTooltip(weapon),
    rows: filasInfoArma(weapon),
  };
}
