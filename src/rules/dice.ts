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

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/** Tirada de dado genérico, p. ej. d8, d10, d12. */
export function tirarDadoDenominacion(denominacion: string): number {
  const match = /^d(\d+)$/i.exec(denominacion.trim());
  if (!match) return 0;
  const sides = Number.parseInt(match[1] ?? "0", 10);
  if (sides < 1) return 0;
  return Math.floor(Math.random() * sides) + 1;
}
