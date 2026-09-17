import { create } from "zustand";
import {
  clearActiveContentPack,
  loadActiveContentPackRow,
  parseContentPackJson,
  saveActiveContentPack,
} from "@/db/content-pack-repository";
import { buildCatalog, defaultCatalog, type GameCatalog } from "@/rules/catalog";
import type { ContentPack } from "@/schemas/content-pack";

interface CatalogState {
  ready: boolean;
  packSource: "none" | "user";
  pack: ContentPack | null;
  catalog: GameCatalog;
  init: () => Promise<void>;
  importPack: (json: string) => Promise<ContentPack>;
  removePack: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  ready: true,
  packSource: "none",
  pack: null,
  catalog: defaultCatalog,
  init: async () => {
    const active = await loadActiveContentPackRow();

    if (active?.origin === "user") {
      set({
        pack: active.pack,
        catalog: buildCatalog(active.pack),
        packSource: "user",
        ready: true,
      });
      return;
    }

    if (active?.origin === "bundled") {
      await clearActiveContentPack();
    }

    set({ pack: null, catalog: defaultCatalog, packSource: "none", ready: true });
  },
  importPack: async (json) => {
    const pack = parseContentPackJson(json);
    await saveActiveContentPack(pack, "user");
    set({ pack, catalog: buildCatalog(pack), packSource: "user", ready: true });
    return pack;
  },
  removePack: async () => {
    await clearActiveContentPack();
    set({ pack: null, catalog: defaultCatalog, packSource: "none", ready: true });
  },
}));
