import { DiceSourceSelector } from "@/components/DiceSourceSelector";
import { RollModeSelector } from "@/components/RollModeSelector";
import { useUiStore } from "@/stores/ui-store";

export function RollSettingsBar({
  compact = false,
  hideTitle = false,
}: {
  compact?: boolean;
  hideTitle?: boolean;
}) {
  const diceSource = useUiStore((s) => s.diceSource);
  const setDiceSource = useUiStore((s) => s.setDiceSource);
  const rollMode = useUiStore((s) => s.rollMode);
  const setRollMode = useUiStore((s) => s.setRollMode);
  const physicalDie1 = useUiStore((s) => s.physicalDie1);
  const physicalDie2 = useUiStore((s) => s.physicalDie2);
  const setPhysicalDie1 = useUiStore((s) => s.setPhysicalDie1);
  const setPhysicalDie2 = useUiStore((s) => s.setPhysicalDie2);

  return (
    <div className={compact ? "space-y-2" : "sheet-sidebar-panel space-y-3"}>
      {!hideTitle && <h3 className="text-sm font-semibold">Tiradas</h3>}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="space-y-1.5">
          <span className="sheet-field-label">Origen del dado</span>
          <DiceSourceSelector source={diceSource} onChange={setDiceSource} compact={compact} />
        </div>
        <div className="space-y-1.5">
          <span className="sheet-field-label">Modo de tirada</span>
          <RollModeSelector mode={rollMode} onChange={setRollMode} compact={compact} />
        </div>
        {diceSource === "physical" && (
          <>
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
            <p className="basis-full text-xs leading-relaxed text-muted sm:basis-auto sm:max-w-xs sm:pb-1">
              Introduce el resultado de tus dados físicos antes de pulsar tirar.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
