import { Button } from "@/components/layout";
import { usePwaStore } from "@/stores/pwa-store";

export function UpdateBanner() {
  const hayActualizacion = usePwaStore((s) => s.hayActualizacion);
  const recargarApp = usePwaStore((s) => s.recargarApp);

  if (!hayActualizacion || !recargarApp) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-gold/40 bg-panel px-4 py-2 shadow-lg">
      <p className="text-sm">Hay una nueva versión de la app disponible.</p>
      <Button variant="primary" onClick={() => recargarApp()}>
        Actualizar ahora
      </Button>
    </div>
  );
}
