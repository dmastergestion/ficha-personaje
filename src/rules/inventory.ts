import type { EquipmentItem } from "@/schemas/character";

/** Capacidad de carga SRD: Fuerza × 15 lb. */
export function capacidadCarga(strScore: number): number {
  return Math.max(0, strScore) * 15;
}

export function pesoItem(item: EquipmentItem): number {
  return item.qty * item.weightLb;
}

export function pesoTotalInventario(items: EquipmentItem[]): number {
  return items.reduce((sum, item) => sum + pesoItem(item), 0);
}

export type EstadoCarga = "ligera" | "sobrecarga";

export function estadoCarga(strScore: number, pesoTotal: number): EstadoCarga {
  return pesoTotal > capacidadCarga(strScore) ? "sobrecarga" : "ligera";
}

export function etiquetaEstadoCarga(estado: EstadoCarga): string {
  return estado === "sobrecarga" ? "Sobrecarga" : "Carga normal";
}
