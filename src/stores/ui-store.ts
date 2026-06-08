import { create } from "zustand";
import type { D20Roll } from "@/rules/dice";

interface UiState {
  ultimaTirada: D20Roll | null;
  setUltimaTirada: (roll: D20Roll | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  ultimaTirada: null,
  setUltimaTirada: (ultimaTirada) => set({ ultimaTirada }),
}));
