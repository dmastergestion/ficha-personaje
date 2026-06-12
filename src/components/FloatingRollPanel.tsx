import { useState } from "react";
import { RollResultsPanel } from "@/components/RollResultsPanel";
import { useUiStore } from "@/stores/ui-store";

const BOTTOM_OFFSET =
  "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]";

/** Panel flotante de tiradas — solo móvil/tablet (en lg+ va en la barra lateral). */
export function FloatingRollPanel() {
  const [minimized, setMinimized] = useState(true);
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);
  const ultimoAtaque = useUiStore((s) => s.ultimoAtaque);

  const resumen = ultimoAtaque?.toHit.total ?? ultimaTirada?.total ?? null;

  if (minimized) {
    return (
      <button
        type="button"
        className={`fixed ${BOTTOM_OFFSET} right-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border border-gold/40 bg-panel/95 px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur touch-manipulation lg:hidden`}
        onClick={() => setMinimized(false)}
        title="Mostrar panel de tiradas"
        aria-expanded={false}
      >
        <span aria-hidden>🎲</span>
        {resumen !== null ? <span>={resumen}</span> : <span>Tiradas</span>}
      </button>
    );
  }

  return (
    <aside
      className={`fixed inset-x-3 ${BOTTOM_OFFSET} z-50 flex h-[33dvh] max-h-[33dvh] flex-col rounded-xl border border-white/15 bg-panel/95 shadow-xl backdrop-blur lg:hidden`}
      aria-label="Panel de tiradas"
      aria-expanded
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <span className="text-sm font-semibold">Resultado</span>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-sm text-muted hover:bg-white/5 hover:text-white touch-manipulation"
          onClick={() => setMinimized(true)}
          title="Minimizar"
          aria-label="Minimizar panel de tiradas"
        >
          −
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <RollResultsPanel />
      </div>
    </aside>
  );
}
