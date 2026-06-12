import { etiquetaCompetenciaArmadura } from "@/rules/proficiencies";
import { obtenerArmadura, t, type SrdArmor } from "@/rules/srd";

export function filasInfoArmadura(armor: SrdArmor): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Categoría", value: etiquetaCompetenciaArmadura(armor.category) },
    { label: "CA base", value: String(armor.baseAc) },
  ];

  if (armor.dexMax === null) {
    rows.push({ label: "Mod. DES", value: "Sin límite" });
  } else if (armor.dexMax === 0) {
    rows.push({ label: "Mod. DES", value: "No aplica" });
  } else {
    rows.push({ label: "Mod. DES máx.", value: `+${armor.dexMax}` });
  }

  if (armor.strengthMin !== null) {
    rows.push({ label: "FUE mínima", value: String(armor.strengthMin) });
  }

  return rows;
}

const ARMOR_ABBR: Record<string, string> = {
  "chain-mail": "Cota",
  "chain-shirt": "Cota m.",
  "plate-armor": "Placa",
  "splint-armor": "Lamin.",
  "ring-mail": "Anill.",
  "half-plate-armor": "Media pl.",
  "breastplate": "Peto",
  "scale-mail": "Escamas",
  "hide-armor": "Pieles",
  "leather-armor": "Cuero",
  "padded-armor": "Acolch.",
  "studded-leather-armor": "Cuero t.",
};

/** Etiqueta corta para el desglose de CA en la ficha. */
export function abreviaturaArmadura(armor: SrdArmor, nombreEs?: string): string {
  return ARMOR_ABBR[armor.id] ?? nombreEs?.split(/\s+/)[0] ?? "Arm";
}

export function resumenArmaduraTooltip(armor: SrdArmor): string {
  const cat = etiquetaCompetenciaArmadura(armor.category);
  if (armor.category === "shield") return `${cat} · CA +2`;
  const dex =
    armor.dexMax === null
      ? "DES sin límite"
      : armor.dexMax === 0
        ? "sin mod. DES"
        : `DES máx. +${armor.dexMax}`;
  return `${cat} · CA ${armor.baseAc} · ${dex}`;
}

export function infoArmaduraPorId(armorId: string | null | undefined): {
  armor: SrdArmor;
  name: string;
  tip: string;
  rows: { label: string; value: string }[];
} | null {
  if (!armorId) return null;
  const armor = obtenerArmadura(armorId);
  if (!armor) return null;
  return {
    armor,
    name: t("armor", armor.id, armor.nameEn),
    tip: resumenArmaduraTooltip(armor),
    rows: filasInfoArmadura(armor),
  };
}
