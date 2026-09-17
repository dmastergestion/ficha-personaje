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
  sheetTabsById: Record<string, SheetTab>;
  setSheetTab: (characterId: string, tab: SheetTab) => void;
  rollPanelExpanded: boolean;
  setRollPanelExpanded: (open: boolean) => void;
  rollMode: RollMode;
  setRollMode: (mode: RollMode) => void;
  diceSource: DiceSource;
  setDiceSource: (source: DiceSource) => void;
  physicalDie1: string;
  physicalDie2: string;
  setPhysicalDie1: (value: string) => void;
  setPhysicalDie2: (value: string) => void;
  tipoDanio: string;
  setTipoDanio: (tipo: string) => void;
  focusPhysicalDie: "1" | "2" | null;
  setFocusPhysicalDie: (which: "1" | "2" | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  ultimaTirada: null,
  ultimaTiradaExtra: null,
  setUltimaTirada: (ultimaTirada, extra) =>
    set({
      ultimaTirada,
      ultimoAtaque: null,
      ultimaTiradaExtra: extra === undefined ? null : extra,
      rollPanelExpanded: ultimaTirada != null || extra != null,
    }),
  ultimoAtaque: null,
  setUltimoAtaque: (ultimoAtaque) =>
    set({
      ultimoAtaque,
      ultimaTirada: ultimoAtaque?.toHit ?? null,
      ultimaTiradaExtra: null,
      rollPanelExpanded: ultimoAtaque != null,
    }),
  sheetTabsById: {},
  setSheetTab: (characterId, sheetTab) =>
    set((s) => ({ sheetTabsById: { ...s.sheetTabsById, [characterId]: sheetTab } })),
  rollPanelExpanded: false,
  setRollPanelExpanded: (rollPanelExpanded) => set({ rollPanelExpanded }),
  rollMode: "normal",
  setRollMode: (rollMode) => set({ rollMode }),
  diceSource: "physical",
  setDiceSource: (diceSource) => set({ diceSource }),
  physicalDie1: "",
  physicalDie2: "",
  setPhysicalDie1: (physicalDie1) => set({ physicalDie1 }),
  setPhysicalDie2: (physicalDie2) => set({ physicalDie2 }),
  tipoDanio: "",
  setTipoDanio: (tipoDanio) => set({ tipoDanio }),
  focusPhysicalDie: null,
  setFocusPhysicalDie: (focusPhysicalDie) => set({ focusPhysicalDie }),
}));