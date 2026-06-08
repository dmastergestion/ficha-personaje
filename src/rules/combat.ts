import { modificadorAtributo } from "@/rules/ability";
import type { SrdArmor } from "@/rules/srd";

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
