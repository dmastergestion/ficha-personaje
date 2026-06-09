import { useState } from "react";
import { RollResultsPanel } from "@/components/RollResultsPanel";
import { useUiStore } from "@/stores/ui-store";

/** Panel flotante de tiradas — solo móvil (en escritorio va en la barra lateral). */
export function FloatingRollPanel() {
  const [minimized, setMinimized] = useState(false);
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);
  const ultimoAtaque = useUiStore((s) => s.ultimoAtaque);

  const resumen = ultimoAtaque?.toHit.total ?? ultimaTirada?.total ?? null;

  if (minimized) {
    return (
      <button
        type="button"
        className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-50 flex items-center gap-2 rounded-full border border-gold/40 bg-panel/95 px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur lg:hidden"
        onClick={() => setMinimized(false)}
        title="Mostrar panel de tiradas"
      >
        <span aria-hidden>🎲</span>
        {resumen !== null ? <span>={resumen}</span> : <span>Tiradas</span>}
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-50 w-[min(100vw-1.5rem,20rem)] rounded-xl border border-white/15 bg-panel/95 shadow-xl backdrop-blur lg:hidden"
      aria-label="Panel de tiradas"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="text-sm font-semibold">Resultado</span>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-sm text-muted hover:bg-white/5 hover:text-white"
          onClick={() => setMinimized(true)}
          title="Minimizar"
        >
          −
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto p-3">
        <RollResultsPanel />
      </div>
    </aside>
  );
}
