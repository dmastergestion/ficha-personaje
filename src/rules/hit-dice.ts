import { dadosDeGolpePorClase } from "@/rules/multiclass";
import type { Character } from "@/schemas/character";

export type PoolDadoGolpe = {
  die: string;
  total: number;
  gastados: number;
  disponibles: number;
};

/** Gastos por denominación (p. ej. { d8: 2, d10: 1 }). */
export function gastadosPorDado(character: Character): Record<string, number> {
  const explicit = character.combat.hitDiceSpentByDie;
  if (explicit && Object.keys(explicit).length > 0) {
    return { ...explicit };
  }
  if (character.combat.hitDiceUsed > 0) {
    return { [character.combat.hitDie]: character.combat.hitDiceUsed };
  }
  return {};
}

export function poolDadosGolpe(character: Character): PoolDadoGolpe[] {
  return dadosDeGolpePorClase(character.identity.classes).map(({ die, total }) => {
    const gastados = Math.min(total, gastadosPorDado(character)[die] ?? 0);
    return {
      die,
      total,
      gastados,
      disponibles: Math.max(0, total - gastados),
    };
  });
}

export function totalDadosDisponibles(pool: PoolDadoGolpe[]): number {
  return pool.reduce((sum, row) => sum + row.disponibles, 0);
}

/** Dados de golpe disponibles para gastar en descanso corto. */
export function dadosGolpeDisponibles(character: Character): {
  disponibles: number;
  gastados: number;
  total: number;
} {
  const pool = poolDadosGolpe(character);
  const total = character.combat.hitDiceTotal;
  const gastados = Math.min(
    total,
    pool.reduce((sum, row) => sum + row.gastados, 0),
  );
  return {
    disponibles: totalDadosDisponibles(pool),
    gastados,
    total,
  };
}

export function etiquetaDadosGolpe(character: Character): string {
  const { disponibles, total } = dadosGolpeDisponibles(character);
  return `${disponibles}/${total}`;
}

/** Recupera dados gastados al finalizar un descanso largo (mitad del nivel, mín. 1). */
export function recuperarDadosDescansoLargo(
  spentByDie: Record<string, number>,
  toRecover: number,
): Record<string, number> {
  const next = { ...spentByDie };
  let left = toRecover;
  const dies = Object.keys(next).sort(
    (a, b) => (Number.parseInt(a.slice(1), 10) || 0) - (Number.parseInt(b.slice(1), 10) || 0),
  );
  for (const die of dies) {
    while (left > 0 && (next[die] ?? 0) > 0) {
      next[die]!--;
      if (next[die] === 0) delete next[die];
      left--;
    }
  }
  return next;
}

export function sincronizarGastosDados(
  spentByDie: Record<string, number>,
  hitDiceTotal: number,
): { hitDiceSpentByDie: Record<string, number>; hitDiceUsed: number } {
  const hitDiceUsed = Math.min(
    hitDiceTotal,
    Object.values(spentByDie).reduce((sum, n) => sum + n, 0),
  );
  return { hitDiceSpentByDie: spentByDie, hitDiceUsed };
}

function fmtMod(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`;
}

/** Texto legible para el panel de tiradas (dado + mod. CON = PV). */
export function mensajeTiradaDadoGolpe(
  die: string,
  tirada: number,
  conMod: number,
  curacion: number,
): string {
  return `Dado de golpe (${die}): ${tirada} ${fmtMod(conMod)} CON = ${curacion} PV`;
}
