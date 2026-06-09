import type { AbilityKey } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import type { RollMode, D20Roll, DiceRollOptions } from "@/rules/dice";
import { tiradaAtaque } from "@/rules/effects";
import type { ConditionId } from "@/lib/conditions";
import type { Character, CombatAttack } from "@/schemas/character";

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "fuerza",
  dex: "destreza",
  con: "constitución",
  int: "inteligencia",
  wis: "sabiduría",
  cha: "carisma",
};

const MOD_TOKEN: Record<string, AbilityKey> = {
  FUE: "str",
  DES: "dex",
  CON: "con",
  INT: "int",
  SAB: "wis",
  CAR: "cha",
};

export interface DesgloseAtaque {
  abilityMod: number;
  proficiencyMod: number;
  magicMod: number;
  abilityLabel: string;
}

export interface PartesDaño {
  dice: { count: number; sides: number } | null;
  flatBase: number;
  abilityKey: AbilityKey | null;
  flatBonus: number;
}

export interface TiradaDaño {
  rolls: number[];
  diceTotal: number;
  abilityMod: number;
  flatBonus: number;
  flatBase: number;
  total: number;
  isCritical: boolean;
  formula: string;
  explicacion: string;
}

export interface ResultadoAtaque {
  attackName: string;
  toHit: D20Roll;
  desglose: DesgloseAtaque;
  explicacionToHit: string;
  targetAc: number | null;
  impacta: boolean | null;
  explicacionImpacto: string;
  damage: TiradaDaño | null;
  explicacionDaño: string | null;
}

export function desgloseAtaque(character: Character, attack: CombatAttack): DesgloseAtaque {
  const abilityMod = modificadorAtributo(character.abilities[attack.abilityKey]);
  const proficiencyMod = attack.proficient
    ? bonificadorCompetencia(character.identity.level)
    : 0;
  const magicMod = attack.magicBonus ?? 0;
  return {
    abilityMod,
    proficiencyMod,
    magicMod,
    abilityLabel: ABILITY_LABELS[attack.abilityKey],
  };
}

export function parsePartesDaño(damage: string, attack: CombatAttack): PartesDaño {
  const text = damage.trim();
  const diceMatch = /(\d+)d(\d+)/i.exec(text);
  const dice = diceMatch
    ? { count: Number(diceMatch[1]), sides: Number(diceMatch[2]) }
    : null;

  let flatBase = 0;
  if (!dice) {
    const flatMatch = /^(\d+)\s*\+/i.exec(text) ?? /^(\d+)\s*$/i.exec(text);
    if (flatMatch) flatBase = Number(flatMatch[1]);
  }

  let abilityKey: AbilityKey | null = attack.abilityKey;
  const modMatch = /MOD\s+(FUE|DES|CON|INT|SAB|CAR)/i.exec(text);
  if (modMatch) {
    abilityKey = MOD_TOKEN[modMatch[1]!.toUpperCase()] ?? attack.abilityKey;
  }

  let flatBonus = 0;
  const withoutDice = text.replace(/\d+d\d+/gi, "");
  const numericParts = withoutDice.match(/[+-]\s*(\d+)/g) ?? [];
  for (const part of numericParts) {
    const n = Number(part.replace(/[+\s]/g, ""));
    if (!Number.isNaN(n)) flatBonus += part.trim().startsWith("-") ? -n : n;
  }

  if ((attack.magicBonus ?? 0) > 0 && !text.includes(String(attack.magicBonus))) {
    flatBonus += attack.magicBonus ?? 0;
  }

  return { dice, flatBase, abilityKey, flatBonus };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function tirarDaño(
  partes: PartesDaño,
  abilityMod: number,
  isCritical: boolean,
): TiradaDaño {
  const rolls: number[] = [];
  let diceTotal = 0;

  if (partes.dice) {
    const count = isCritical ? partes.dice.count * 2 : partes.dice.count;
    for (let i = 0; i < count; i++) {
      const r = rollDie(partes.dice.sides);
      rolls.push(r);
      diceTotal += r;
    }
  }

  const ability = partes.abilityKey ? abilityMod : 0;
  const total = diceTotal + partes.flatBase + ability + partes.flatBonus;

  const diceLabel = partes.dice
    ? isCritical
      ? `${partes.dice.count * 2}d${partes.dice.sides}`
      : `${partes.dice.count}d${partes.dice.sides}`
    : null;

  const partesTexto: string[] = [];
  if (diceLabel) {
    partesTexto.push(
      rolls.length > 1
        ? `${diceLabel} = ${rolls.join("+")} = ${diceTotal}`
        : `${diceLabel} = ${diceTotal}`,
    );
  } else if (partes.flatBase > 0) {
    partesTexto.push(String(partes.flatBase));
  }
  if (ability !== 0) {
    partesTexto.push(`${fmtMod(ability)} (${ABILITY_LABELS[partes.abilityKey!]})`);
  }
  if (partes.flatBonus !== 0) {
    partesTexto.push(`${fmtMod(partes.flatBonus)} (mágico)`);
  }

  const formula = partes.dice
    ? `${isCritical ? partes.dice.count * 2 : partes.dice.count}d${partes.dice.sides}${ability !== 0 ? ` + ${ability}` : ""}${partes.flatBonus ? ` + ${partes.flatBonus}` : ""}`
    : `${partes.flatBase}${ability !== 0 ? ` + ${ability}` : ""}${partes.flatBonus ? ` + ${partes.flatBonus}` : ""}`;

  return {
    rolls,
    diceTotal,
    abilityMod: ability,
    flatBonus: partes.flatBonus,
    flatBase: partes.flatBase,
    total,
    isCritical,
    formula,
    explicacion: `${partesTexto.join(" ")} = ${total}`,
  };
}

export function formatearD20(toHit: D20Roll): string {
  if (toHit.rolls.length === 2) {
    const [a, b] = toHit.rolls;
    const criterio = toHit.mode === "advantage" ? "mayor" : "menor";
    return `d20: ${a} y ${b} (${criterio}: ${toHit.used})`;
  }
  return `d20: ${toHit.used}`;
}

export function parseTargetAc(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function formatearToHit(toHit: D20Roll, desglose: DesgloseAtaque): string {
  let s = formatearD20(toHit);
  if (desglose.abilityMod !== 0) {
    s += ` ${fmtMod(desglose.abilityMod)} (${desglose.abilityLabel})`;
  }
  if (desglose.proficiencyMod !== 0) {
    s += ` ${fmtMod(desglose.proficiencyMod)} (competencia)`;
  }
  if (desglose.magicMod !== 0) {
    s += ` ${fmtMod(desglose.magicMod)} (mágico)`;
  }
  return `${s} = ${toHit.total}`;
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

export function evaluarImpacto(
  toHit: D20Roll,
  targetAc: number | null,
): { impacta: boolean | null; explicacion: string } {
  if (targetAc === null || Number.isNaN(targetAc)) {
    return { impacta: null, explicacion: "Indica CA objetivo para saber si impacta." };
  }
  if (toHit.isFumble) {
    return { impacta: false, explicacion: `Pifia (1). Fallo automático vs CA ${targetAc}.` };
  }
  if (toHit.isCritical) {
    return { impacta: true, explicacion: `¡Crítico (20)! Impacta vs CA ${targetAc}.` };
  }
  if (toHit.total >= targetAc) {
    return { impacta: true, explicacion: `Impacta (${toHit.total} ≥ CA ${targetAc}).` };
  }
  return { impacta: false, explicacion: `Fallo (${toHit.total} < CA ${targetAc}).` };
}

export function tirarAtaqueCompleto(
  character: Character,
  attack: CombatAttack,
  rollMode: RollMode,
  conditionIds: ConditionId[],
  exhaustionLevel: number,
  targetAc: number | null,
  diceOptions?: DiceRollOptions,
): ResultadoAtaque | { error: string } {
  const desglose = desgloseAtaque(character, attack);
  const toHitResult = tiradaAtaque(
    desglose.abilityMod + desglose.proficiencyMod + desglose.magicMod,
    rollMode,
    conditionIds,
    exhaustionLevel,
    diceOptions,
  );
  if ("error" in toHitResult) return toHitResult;
  const toHit = toHitResult;
  const { impacta, explicacion: explicacionImpacto } = evaluarImpacto(toHit, targetAc);

  let damage: TiradaDaño | null = null;
  let explicacionDaño: string | null = null;

  const damageFormula = attack.damage?.trim() ?? "";
  if (damageFormula.length > 0) {
    if (impacta === false) {
      explicacionDaño = "Sin daño: el ataque no impacta.";
    } else {
      const partes = parsePartesDaño(damageFormula, attack);
      const abilityMod = partes.abilityKey
        ? modificadorAtributo(character.abilities[partes.abilityKey])
        : 0;
      damage = tirarDaño(partes, abilityMod, toHit.isCritical);
      explicacionDaño =
        impacta === null
          ? `Daño potencial: ${damage.explicacion}`
          : damage.explicacion;
    }
  }

  return {
    attackName: attack.name || "Ataque",
    toHit,
    desglose,
    explicacionToHit: formatearToHit(toHit, desglose),
    targetAc,
    impacta,
    explicacionImpacto,
    damage,
    explicacionDaño,
  };
}
