import { modificadorAtributo } from "@/rules/ability";
import type { SrdArmor } from "@/rules/srd";

export type ParteClaseArmadura = {
  id: string;
  label: string;
};

export type DesgloseClaseArmadura = {
  total: number;
  partes: ParteClaseArmadura[];
  resumen: string;
};

function fmtModCa(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

/** Desglose legible de la CA (armadura, DES, escudo, manual…). */
export function desgloseClaseArmadura(
  dexScore: number,
  armor: SrdArmor | null | undefined,
  shieldEquipped: boolean,
  shield: SrdArmor | null | undefined,
  override: number | null,
  opts?: { etiquetaArmadura?: string; extras?: ParteClaseArmadura[] },
): DesgloseClaseArmadura {
  const extras = opts?.extras ?? [];

  if (override !== null) {
    const partes: ParteClaseArmadura[] = [{ id: "manual", label: `Manual ${override}` }, ...extras];
    return { total: override, partes, resumen: partes.map((p) => p.label).join(" + ") };
  }

  const dexMod = modificadorAtributo(dexScore);
  const partes: ParteClaseArmadura[] = [];
  const worn = armor && armor.category !== "shield" ? armor : null;

  if (!worn) {
    partes.push({ id: "base", label: "Arm 10" });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
  } else if (worn.category === "heavy") {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
  } else if (worn.category === "medium") {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    const maxDex = worn.dexMax ?? 2;
    const applied = Math.min(dexMod, maxDex);
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
    if (applied !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(applied)}` });
  } else {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
  }

  if (shieldEquipped && shield) {
    partes.push({ id: "shield", label: `Esc ${shield.baseAc}` });
  }

  partes.push(...extras);

  const total = calcularClaseArmadura(dexScore, armor, shieldEquipped, shield, override);
  return { total, partes, resumen: partes.map((p) => p.label).join(" + ") };
}

/** Calcula CA según armadura SRD 2024, escudo y override manual. */
export function calcularClaseArmadura(
  dexScore: number,
  armor: SrdArmor | null | undefined,
  shieldEquipped: boolean,
  shield: SrdArmor | null | undefined,
  override: number | null,
): number {
  if (override !== null) return override;

  const dexMod = modificadorAtributo(dexScore);
  let ac = 10 + dexMod;

  if (armor && armor.category !== "shield") {
    if (armor.category === "heavy") {
      ac = armor.baseAc;
    } else if (armor.category === "medium") {
      const maxDex = armor.dexMax ?? 2;
      ac = armor.baseAc + Math.min(dexMod, maxDex);
    } else {
      ac = armor.baseAc + dexMod;
    }
  }

  if (shieldEquipped && shield) {
    ac += shield.baseAc;
  }

  return ac;
}
