import type { DiceRollOptions, DiceSource, RollMode } from "@/rules/dice";
import { useUiStore } from "@/stores/ui-store";

export function useDiceRollOptions(): {
  options: DiceRollOptions;
  isReady: boolean;
  error: string | null;
  diceSource: DiceSource;
  rollMode: RollMode;
} {
  const diceSource = useUiStore((s) => s.diceSource);
  const rollMode = useUiStore((s) => s.rollMode);
  const physicalDie1 = useUiStore((s) => s.physicalDie1);
  const physicalDie2 = useUiStore((s) => s.physicalDie2);

  if (diceSource === "virtual") {
    return {
      options: { source: "virtual" },
      isReady: true,
      error: null,
      diceSource,
      rollMode,
    };
  }

  const die1 = Number.parseInt(physicalDie1, 10);
  const die2 = Number.parseInt(physicalDie2, 10);
  const die1Ok = Number.isInteger(die1) && die1 >= 1 && die1 <= 20;
  const die2Ok = Number.isInteger(die2) && die2 >= 1 && die2 <= 20;
  const needsTwo = rollMode !== "normal";

  if (!die1Ok) {
    return {
      options: { source: "physical", manual: null },
      isReady: false,
      error: "Modo físico: introduce el d20 (1–20) en el panel de tiradas.",
      diceSource,
      rollMode,
    };
  }

  if (needsTwo && !die2Ok) {
    return {
      options: { source: "physical", manual: { die1 } },
      isReady: false,
      error: "Modo físico: con ventaja/desventaja necesitas dos d20 (1–20).",
      diceSource,
      rollMode,
    };
  }

  return {
    options: {
      source: "physical",
      manual: needsTwo ? { die1, die2 } : { die1 },
    },
    isReady: true,
    error: null,
    diceSource,
    rollMode,
  };
}
