import { Button } from "@/components/layout";
import { RollModeSelector } from "@/components/RollModeSelector";
import { tirarD20 } from "@/rules/dice";
import { useUiStore } from "@/stores/ui-store";
import type { SheetTab } from "@/pages/character-sheet/types";

export function BottomCombatBar({ onSelectTab }: { onSelectTab: (tab: SheetTab) => void }) {
  const rollMode = useUiStore((s) => s.rollMode);
  const setRollMode = useUiStore((s) => s.setRollMode);
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mb-2 flex items-center justify-between gap-2">
        <RollModeSelector mode={rollMode} onChange={setRollMode} />
        {ultimaTirada && (
          <span className="text-xs text-muted">
            d20: {ultimaTirada.used}+{ultimaTirada.modifier}={ultimaTirada.total}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onSelectTab("combate")}>
          Combate
        </Button>
        <Button
          variant="critical"
          className="flex-1"
          onClick={() => setUltimaTirada(tirarD20(0, rollMode))}
        >
          Tirar d20
        </Button>
      </div>
    </div>
  );
}
