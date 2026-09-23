import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import type { DatosAsistente } from "@/rules/creation";
import type { Tirada4d6 } from "@/rules/dice";
import { necesitaPasoConjuros, type SeleccionConjuros } from "@/rules/spell-choices";
import type { ModoAtributos, PasoAsistenteId } from "@/pages/character-new/types";

export const DRAFT_KEY = "ficha-asistente-borrador-v3";

export const SELECCION_CONJUROS_VACIA: SeleccionConjuros = {
  cantripsKnown: [],
  spellsKnown: [],
  spellsPrepared: [],
};

export const ABILITIES_DEFAULT = Object.fromEntries(
  ABILITY_KEYS.map((k) => [k, 10]),
) as Record<AbilityKey, number>;

export function pasosAsistente(
  classId: string | null,
  level: number,
): { id: PasoAsistenteId; titulo: string }[] {
  const base: { id: PasoAsistenteId; titulo: string }[] = [
    { id: "clase", titulo: "Clase" },
    { id: "origen", titulo: "Origen" },
    { id: "atributos", titulo: "Atributos" },
  ];
  if (necesitaPasoConjuros(classId, level)) {
    base.push({ id: "conjuros", titulo: "Conjuros" });
  }
  base.push({ id: "identidad", titulo: "Identidad" });
  base.push({ id: "resumen", titulo: "Resumen" });
  return base;
}

export type BorradorAsistente = Partial<{
  datos: DatosAsistente;
  paso: number;
  modoAtributos: ModoAtributos;
  asignacion4d6: Partial<Record<AbilityKey, number>>;
  asignacionArray: Partial<Record<AbilityKey, number>>;
  spellSelection: SeleccionConjuros;
  tiradas4d6: Tirada4d6[] | null;
}>;

export function modoAtributosDesdeBorrador(raw: unknown): ModoAtributos {
  if (raw === "4d6" || raw === "array" || raw === "pointBuy" || raw === "sinElegir") {
    return raw;
  }
  return "sinElegir";
}

export function leerBorrador(): BorradorAsistente | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BorradorAsistente) : null;
  } catch {
    return null;
  }
}
