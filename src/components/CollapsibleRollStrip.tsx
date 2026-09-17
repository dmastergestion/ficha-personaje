import { RollResultsPanel } from "@/components/RollResultsPanel";
import { RollSettingsBar } from "@/components/RollSettingsBar";
import type { ResultadoAtaque } from "@/rules/attack-roll";
import type { D20Roll } from "@/rules/dice";
import { useUiStore } from "@/stores/ui-store";

function textoResumen(
  ultimoAtaque: ResultadoAtaque | null,
  ultimaTirada: D20Roll | null,
  extra: string | null,
): string {
  if (ultimoAtaque) {
    const critico = ultimoAtaque.toHit.isCritical ? " · Crítico" : "";
    const pifia = ultimoAtaque.toHit.isFumble ? " · Pifia" : "";
    return `${ultimoAtaque.attackName}: ${ultimoAtaque.toHit.total}${critico}${pifia}`;
  }
  if (ultimaTirada) {
    const critico = ultimaTirada.isCritical ? " · Crítico" : "";
    const pifia = ultimaTirada.isFumble ? " · Pifia" : "";
    return `=${ultimaTirada.total}${critico}${pifia}`;
  }
  if (extra) return extra;
  return "Sin tiradas aún";
}

/** Franja colapsable de tiradas — debajo de stats rápidos. */
export function CollapsibleRollStrip() {
  const expanded = useUiStore((s) => s.rollPanelExpanded);
  const setExpanded = useUiStore((s) => s.setRollPanelExpanded);
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);
  const ultimoAtaque = useUiStore((s) => s.ultimoAtaque);
  const ultimaTiradaExtra = useUiStore((s) => s.ultimaTiradaExtra);

  const hayResultado = !!(ultimoAtaque || ultimaTirada || ultimaTiradaExtra);
  const resumen = textoResumen(ultimoAtaque, ultimaTirada, ultimaTiradaExtra);

  return (
    <section className="sheet-rolls-strip mb-2" aria-label="Panel de tiradas">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-panel px-3 py-2 text-left touch-manipulation hover:bg-panel/80"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        title={expanded ? "Plegar tiradas" : "Expandir tiradas"}
      >
        <span className="shrink-0 text-sm font-semibold">Tiradas</span>
        <span
          className={`min-w-0 flex-1 truncate text-sm tabular-nums ${
            hayResultado ? "font-semibold text-accent" : "text-muted"
          }`}
          aria-live="polite"
        >
          {resumen}
        </span>
        <span className="shrink-0 text-sm text-muted" aria-hidden>
          {expanded ? "▴" : "▾"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded-xl border border-white/10 bg-panel p-3">
          <RollSettingsBar compact hideTitle />
          <div className="border-t border-white/10 pt-3">
            <RollResultsPanel hideTitle />
          </div>
        </div>
      )}
    </section>
  );
}
