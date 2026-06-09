import { useEffect, type ReactNode } from "react";
import { useCatalogStore } from "@/stores/catalog-store";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const init = useCatalogStore((s) => s.init);
  const ready = useCatalogStore((s) => s.ready);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 text-muted">
        Cargando catálogo…
      </div>
    );
  }

  return children;
}
