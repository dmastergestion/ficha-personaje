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
  if (!item?.requiresAttunement) return true;
  if (item.attuned) return true;
  return objetosSintonizados(items).length < MAX_SINTONIZACION;
}

export type EstadoCarga = "ligera" | "sobrecarga";

export function estadoCarga(strScore: number, pesoTotal: number): EstadoCarga {
  return pesoTotal > capacidadCarga(strScore) ? "sobrecarga" : "ligera";
}

export function etiquetaEstadoCarga(estado: EstadoCarga): string {
  return estado === "sobrecarga" ? "Sobrecarga" : "Carga normal";
}
