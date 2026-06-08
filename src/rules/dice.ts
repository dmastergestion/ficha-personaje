export type RollMode = "normal" | "advantage" | "disadvantage";

export interface D20Roll {
  mode: RollMode;
  rolls: [number] | [number, number];
  used: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/** Tirada d20 con modificador y ventaja/desventaja (reglas 2024). */
export function tirarD20(modifier = 0, mode: RollMode = "normal"): D20Roll {
  if (mode === "normal") {
    const used = rollD20();
    const total = used + modifier;
    return {
      mode,
      rolls: [used],
      used,
      modifier,
      total,
      isCritical: used === 20,
      isFumble: used === 1,
    };
  }

  const a = rollD20();
  const b = rollD20();
  const used = mode === "advantage" ? Math.max(a, b) : Math.min(a, b);
  const total = used + modifier;

  return {
    mode,
    rolls: [a, b],
    used,
    modifier,
    total,
    isCritical: used === 20,
    isFumble: used === 1,
  };
}
