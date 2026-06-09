import { Button } from "@/components/layout";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { tiradaAtaque } from "@/rules/effects";
import type { Character } from "@/schemas/character";
import type { SheetTab } from "@/pages/character-sheet/types";
import { useUiStore } from "@/stores/ui-store";

export function BottomCombatBar({
  character,
  onSelectTab,
}: {
  character: Character;
  onSelectTab: (tab: SheetTab) => void;
}) {
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onSelectTab("combate")}>
          Combate
        </Button>
        <Button
          variant="critical"
          className="flex-1"
          onClick={() => {
            if (!diceRoll.isReady) {
              setUltimaTirada(null, diceRoll.error);
              return;
            }
            const result = tiradaAtaque(
              0,
              rollMode,
              character.combat.conditionIds,
              character.combat.exhaustionLevel,
              diceRoll.options,
            );
            if ("error" in result) {
              setUltimaTirada(null, result.error);
              return;
            }
            setUltimaTirada(result);
          }}
        >
          Tirar d20
        </Button>
      </div>
    </div>
  );
}
