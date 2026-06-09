import { DiceSourceSelector } from "@/components/DiceSourceSelector";
import { RollModeSelector } from "@/components/RollModeSelector";
import { useUiStore } from "@/stores/ui-store";

export function RollSettingsBar({ compact = false }: { compact?: boolean }) {
  const diceSource = useUiStore((s) => s.diceSource);
  const setDiceSource = useUiStore((s) => s.setDiceSource);
  const rollMode = useUiStore((s) => s.rollMode);
  const setRollMode = useUiStore((s) => s.setRollMode);
  const physicalDie1 = useUiStore((s) => s.physicalDie1);
  const physicalDie2 = useUiStore((s) => s.physicalDie2);
  const setPhysicalDie1 = useUiStore((s) => s.setPhysicalDie1);
  const setPhysicalDie2 = useUiStore((s) => s.setPhysicalDie2);

  return (
    <div className={compact ? "space-y-3" : "sheet-sidebar-panel space-y-3"}>
      <h3 className="text-sm font-semibold">Tiradas</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:flex-col lg:items-stretch">
        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="sheet-field-label">Origen del dado</span>
          <DiceSourceSelector source={diceSource} onChange={setDiceSource} compact={compact} />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="sheet-field-label">Modo de tirada</span>
          <RollModeSelector mode={rollMode} onChange={setRollMode} compact={compact} />
        </div>
      </div>
      {diceSource === "physical" && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1">
              <span className="sheet-field-label">D20</span>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="1–20"
                className="sheet-input w-20"
                value={physicalDie1}
                onChange={(e) => setPhysicalDie1(e.target.value)}
              />
            </label>
            {rollMode !== "normal" && (
              <label className="space-y-1">
                <span className="sheet-field-label">2º D20</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="1–20"
                  className="sheet-input w-20"
                  value={physicalDie2}
                  onChange={(e) => setPhysicalDie2(e.target.value)}
                />
              </label>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Introduce el resultado de tus dados físicos antes de pulsar tirar.
          </p>
        </div>
      )}
    </div>
  );
}
