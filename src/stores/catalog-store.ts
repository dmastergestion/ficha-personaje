import { create } from "zustand";
import {
  clearActiveContentPack,
  loadActiveContentPackRow,
  parseContentPackJson,
  saveActiveContentPack,
} from "@/db/content-pack-repository";
import { buildCatalog, defaultCatalog, type GameCatalog } from "@/rules/catalog";
import type { ContentPack } from "@/schemas/content-pack";

const PACK_URL = `${import.meta.env.BASE_URL}content-pack/xphb-pack.json`;

async function fetchBundledPack(): Promise<ContentPack | null> {
  try {
    const res = await fetch(PACK_URL);
    if (!res.ok) return null;
    return parseContentPackJson(await res.text());
  } catch {
    return null;
  }
}

interface CatalogState {
  ready: boolean;
  pack: ContentPack | null;
  catalog: GameCatalog;
  init: () => Promise<void>;
  importPack: (json: string) => Promise<ContentPack>;
  removePack: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  ready: false,
  pack: null,
  catalog: defaultCatalog,
  init: async () => {
    const active = await loadActiveContentPackRow();

    // No sobrescribir nunca un pack importado por el usuario.
    if (active?.origin === "user") {
      set({ pack: active.pack, catalog: buildCatalog(active.pack), ready: true });
      return;
    }

    const bundled = await fetchBundledPack();

    // Auto-cargar el pack incluido si no hay nada, o si trae una versión más reciente.
    const debeActualizar =
      bundled &&
      (!active || bundled.generatedAt > active.pack.generatedAt);

    if (bundled && debeActualizar) {
      await saveActiveContentPack(bundled, "bundled");
      set({ pack: bundled, catalog: buildCatalog(bundled), ready: true });
      return;
    }

    const pack = active?.pack ?? null;
    set({ pack, catalog: buildCatalog(pack), ready: true });
  },
  importPack: async (json) => {
    const pack = parseContentPackJson(json);
    await saveActiveContentPack(pack, "user");
    set({ pack, catalog: buildCatalog(pack), ready: true });
    return pack;
  },
  removePack: async () => {
    await clearActiveContentPack();
    set({ pack: null, catalog: defaultCatalog, ready: true });
  },
}));
