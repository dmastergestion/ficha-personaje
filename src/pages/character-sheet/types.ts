import type { Character } from "@/schemas/character";

export type SheetTab =
  | "resumen"
  | "combate"
  | "hechizos"
  | "equipo"
  | "notas"
  | "informacion";

export const SHEET_TABS: { id: SheetTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "combate", label: "Combate" },
  { id: "hechizos", label: "Hechizos" },
  { id: "equipo", label: "Equipo" },
  { id: "notas", label: "Notas" },
  { id: "informacion", label: "Catálogo" },
];

export interface SheetTabProps {
  character: Character;
  onChange: (next: Character) => void;
}
