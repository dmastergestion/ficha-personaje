import { create } from "zustand";

interface PwaState {
  hayActualizacion: boolean;
  setHayActualizacion: (value: boolean) => void;
  recargarApp: (() => void) | null;
  setRecargarApp: (fn: (() => void) | null) => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  hayActualizacion: false,
  setHayActualizacion: (hayActualizacion) => set({ hayActualizacion }),
  recargarApp: null,
  setRecargarApp: (recargarApp) => set({ recargarApp }),
}));
