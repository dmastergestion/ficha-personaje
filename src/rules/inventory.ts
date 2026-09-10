import type { CharacterCurrency, EquipmentItem } from "@/schemas/character";
import { pesoMonedas } from "@/rules/currency";

export const MAX_SINTONIZACION = 3;

/** Capacidad de carga SRD: Fuerza × 15 lb. */
export function capacidadCarga(strScore: number): number {
  return Math.max(0, strScore) * 15;
}

export function pesoItem(item: EquipmentItem): number {
  return item.qty * item.weightLb;
}

export function pesoTotalInventario(
  items: EquipmentItem[],
  currency?: CharacterCurrency,
): number {
  const itemsWeight = items.reduce((sum, item) => sum + pesoItem(item), 0);
  return itemsWeight + (currency ? pesoMonedas(currency) : 0);
}

export function objetosSintonizados(items: EquipmentItem[]): EquipmentItem[] {
  return items.filter((i) => i.attuned);
}

export function puedeSintonizar(items: EquipmentItem[], itemId: string): boolean {
  const item = items.find((i) => i.id === itemId);
  if (!item) return false;
  if (item.attuned) return true;
  return objetosSintonizados(items).length < MAX_SINTONIZACION;
}

export type EstadoCarga = "ligera" | "sobrecarga";

export function estadoCarga(strScore: number, pesoTotal: number): EstadoCarga {
  return pesoTotal > capacidadCarga(strScore) ? "sobrecarga" : "ligera";
}

export function itemEfectosActivos(item: EquipmentItem): boolean {
  if (item.qty <= 0) return false;
  if (item.requiresAttunement) return !!item.attuned;
  return (item.acBonus ?? 0) > 0 || (item.grantedResistances?.length ?? 0) > 0 || !!item.attuned;
}

export function bonusCaObjetosMagicos(itemsOrCharacter: EquipmentItem[] | { equipment: { items: EquipmentItem[] } }): number {
  const items = Array.isArray(itemsOrCharacter)
    ? itemsOrCharacter
    : itemsOrCharacter.equipment.items;
  return items.reduce((sum, item) => {
    if (!itemEfectosActivos(item)) return sum;
    return sum + (item.acBonus ?? 0);
  }, 0);
}

export function resistenciasObjetosMagicos(
  itemsOrCharacter: EquipmentItem[] | { equipment: { items: EquipmentItem[] } },
): string[] {
  const items = Array.isArray(itemsOrCharacter)
    ? itemsOrCharacter
    : itemsOrCharacter.equipment.items;
  const out: string[] = [];
  for (const item of items) {
    if (!itemEfectosActivos(item)) continue;
    for (const tipo of item.grantedResistances ?? []) {
      const clave = tipo.toLowerCase();
      if (!out.some((t) => t.toLowerCase() === clave)) out.push(tipo);
    }
  }
  return out;
}

export function etiquetaEstadoCarga(estado: EstadoCarga): string {
  return estado === "sobrecarga" ? "Sobrecarga" : "Carga normal";
}
