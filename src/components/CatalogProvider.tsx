import { useEffect, type ReactNode } from "react";
import { useCatalogStore } from "@/stores/catalog-store";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const init = useCatalogStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return children;
}
