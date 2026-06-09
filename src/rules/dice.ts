export type RollMode = "normal" | "advantage" | "disadvantage";
export type DiceSource = "virtual" | "physical";

export interface ManualD20 {
  die1: number;
  die2?: number;
}

export interface DiceRollOptions {
  source?: DiceSource;
  manual?: ManualD20 | null;
}

export interface D20Roll {
  mode: RollMode;
  rolls: [number] | [number, number];
  used: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  source: DiceSource;
}

export type TiradaD20Result =
  | { ok: true; roll: D20Roll }
  | { ok: false; error: string };

function esD20Valido(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 20;
}

function tiradaD20DesdeValores(
  modifier: number,
  mode: RollMode,
  die1: number,
  die2?: number,
  source: DiceSource = "physical",
): D20Roll {
  if (mode === "normal") {
    const total = die1 + modifier;
    return {
      mode,
      rolls: [die1],
      used: die1,
      modifier,
      total,
      isCritical: die1 === 20,
      isFumble: die1 === 1,
      source,
    };
  }

  const second = die2 ?? die1;
  const used = mode === "advantage" ? Math.max(die1, second) : Math.min(die1, second);
  const total = used + modifier;

  return {
    mode,
    rolls: [die1, second],
    used,
    modifier,
    total,
    isCritical: used === 20,
    isFumble: used === 1,
    source,
  };
}

export function construirTiradaD20(
  modifier: number,
  mode: RollMode,
  options?: DiceRollOptions,
): TiradaD20Result {
  const source = options?.source ?? "virtual";

  if (source === "virtual") {
    return { ok: true, roll: tirarD20(modifier, mode) };
  }

  const manual = options?.manual;
  if (!manual || !esD20Valido(manual.die1)) {
    return { ok: false, error: "Introduce el resultado del dado físico (1–20)." };
  }

  if (mode !== "normal") {
    if (!manual.die2 || !esD20Valido(manual.die2)) {
      return {
        ok: false,
        error: "Con ventaja o desventaja necesitas dos dados físicos (1–20).",
      };
    }
    return {
      ok: true,
      roll: tiradaD20DesdeValores(modifier, mode, manual.die1, manual.die2, "physical"),
    };
  }

  return {
    ok: true,
    roll: tiradaD20DesdeValores(modifier, mode, manual.die1, undefined, "physical"),
  };
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
      source: "virtual",
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
    source: "virtual",
  };
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export interface Tirada4d6 {
  dice: [number, number, number, number];
  dropped: number;
  total: number;
}

/** 4d6 descartando el dado más bajo (regla estándar de generación de atributos). */
export function tirar4d6DescartaMenor(): Tirada4d6 {
  const dice: [number, number, number, number] = [rollD6(), rollD6(), rollD6(), rollD6()];
  const sorted = [...dice].sort((a, b) => a - b);
  const dropped = sorted[0]!;
  const total = sorted.slice(1).reduce((sum, value) => sum + value, 0);
  return { dice, dropped, total };
}

export function tirarSeisAtributos4d6(): Tirada4d6[] {
  return Array.from({ length: 6 }, () => tirar4d6DescartaMenor());
}

/** Tirada de dado genérico, p. ej. d8, d10, d12. */
export function tirarDadoDenominacion(denominacion: string): number {
  const match = /^d(\d+)$/i.exec(denominacion.trim());
  if (!match) return 0;
  const sides = Number.parseInt(match[1] ?? "0", 10);
  if (sides < 1) return 0;
  return Math.floor(Math.random() * sides) + 1;
}
