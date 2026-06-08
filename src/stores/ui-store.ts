import { create } from "zustand";
import type { RollMode, D20Roll } from "@/rules/dice";
import type { SheetTab } from "@/pages/character-sheet/types";

interface UiState {
  ultimaTirada: D20Roll | null;
  setUltimaTirada: (roll: D20Roll | null) => void;
  sheetTab: SheetTab;
  setSheetTab: (tab: SheetTab) => void;
  rollMode: RollMode;
  setRollMode: (mode: RollMode) => void;
}

export const useUiStore = create<UiState>((set) => ({
  ultimaTirada: null,
  setUltimaTirada: (ultimaTirada) => set({ ultimaTirada }),
  sheetTab: "combate",
  setSheetTab: (sheetTab) => set({ sheetTab }),
  rollMode: "normal",
  setRollMode: (rollMode) => set({ rollMode }),
}));
