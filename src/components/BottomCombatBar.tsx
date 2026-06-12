import { Button } from "@/components/layout";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { tirarAtaqueCompleto } from "@/rules/attack-roll";
import { ataquePorId, etiquetaAtaqueId, idAtaqueDefecto } from "@/rules/attacks";
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
  const setUltimoAtaque = useUiStore((s) => s.setUltimoAtaque);
  const attackId = idAtaqueDefecto(character);
  const attackLabel = etiquetaAtaqueId(character, attackId);

  function atacar() {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const attack = ataquePorId(character, attackId);
    if (!attack) return;

    const result = tirarAtaqueCompleto(
      character,
      attack,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      null,
      diceRoll.options,
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimoAtaque(result);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onSelectTab("combate")}>
          Combate
        </Button>
        <Button variant="combat" className="min-w-0 flex-[1.4] truncate" onClick={atacar}>
          Atacar · {attackLabel}
        </Button>
      </div>
    </div>
  );
}
