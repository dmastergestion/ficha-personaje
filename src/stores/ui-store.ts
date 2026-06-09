import { create } from "zustand";
import type { DiceSource, RollMode, D20Roll } from "@/rules/dice";
import type { ResultadoAtaque } from "@/rules/attack-roll";
import type { SheetTab } from "@/pages/character-sheet/types";

interface UiState {
  ultimaTirada: D20Roll | null;
  ultimaTiradaExtra: string | null;
  setUltimaTirada: (roll: D20Roll | null, extra?: string | null) => void;
  ultimoAtaque: ResultadoAtaque | null;
  setUltimoAtaque: (result: ResultadoAtaque | null) => void;
  sheetTab: SheetTab;
  setSheetTab: (tab: SheetTab) => void;
  rollMode: RollMode;
  setRollMode: (mode: RollMode) => void;
  diceSource: DiceSource;
  setDiceSource: (source: DiceSource) => void;
  physicalDie1: string;
  physicalDie2: string;
  setPhysicalDie1: (value: string) => void;
  setPhysicalDie2: (value: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  ultimaTirada: null,
  ultimaTiradaExtra: null,
  setUltimaTirada: (ultimaTirada, extra) =>
    set({
      ultimaTirada,
      ultimoAtaque: null,
      ultimaTiradaExtra: extra === undefined ? null : extra,
    }),
  ultimoAtaque: null,
  setUltimoAtaque: (ultimoAtaque) =>
    set({
      ultimoAtaque,
      ultimaTirada: ultimoAtaque?.toHit ?? null,
      ultimaTiradaExtra: null,
    }),
  sheetTab: "combate",
  setSheetTab: (sheetTab) => set({ sheetTab }),
  rollMode: "normal",
  setRollMode: (rollMode) => set({ rollMode }),
  diceSource: "virtual",
  setDiceSource: (diceSource) => set({ diceSource }),
  physicalDie1: "",
  physicalDie2: "",
  setPhysicalDie1: (physicalDie1) => set({ physicalDie1 }),
  setPhysicalDie2: (physicalDie2) => set({ physicalDie2 }),
}));