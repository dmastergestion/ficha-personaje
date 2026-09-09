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
  packSource: "none" | "bundled" | "user";
  pack: ContentPack | null;
  catalog: GameCatalog;
  init: () => Promise<void>;
  importPack: (json: string) => Promise<ContentPack>;
  removePack: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
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

    if (active?.pack) {
      set({
        pack: active.pack,
        catalog: buildCatalog(active.pack),
        packSource: "bundled",
        ready: true,
      });
    } else {
      set({ ready: true });
    }

    const bundled = await fetchBundledPack();
    if (!bundled) return;
    if (get().packSource === "user") return;

    const debeActualizar = !active || bundled.generatedAt > active.pack.generatedAt;
    if (!debeActualizar) return;

    await saveActiveContentPack(bundled, "bundled");
    if (get().packSource === "user") return;
    set({ pack: bundled, catalog: buildCatalog(bundled), packSource: "bundled", ready: true });
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
