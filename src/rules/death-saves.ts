import type { RollMode, D20Roll, DiceRollOptions } from "@/rules/dice";
import { tiradaSalvacion } from "@/rules/effects";
import { aplicarAgotamientoAlRecuperarPg } from "@/rules/exhaustion";
import type { Character } from "@/schemas/character";

export type DeathSaveOutcome =
  | "success"
  | "failure"
  | "critical_success"
  | "critical_failure"
  | "stable"
  | "dead";

export function resetearSalvacionesMuerte(
  combat: Character["combat"],
): Character["combat"] {
  return { ...combat, deathSaves: { successes: 0, failures: 0 } };
}

export function registrarFalloSalvacionMuerte(
  combat: Character["combat"],
  count = 1,
): { combat: Character["combat"]; outcome?: "stable" | "dead" } {
  if (combat.hpCurrent > 0) return { combat };

  const failures = Math.min(3, combat.deathSaves.failures + count);
  const next = { ...combat, deathSaves: { ...combat.deathSaves, failures } };
  if (failures >= 3) return { combat: next, outcome: "dead" };
  return { combat: next };
}

export function tirarSalvacionMuerte(
  character: Character,
  rollMode: RollMode,
  options: DiceRollOptions,
): {
  character: Character;
  roll: D20Roll;
  outcome: DeathSaveOutcome;
  message: string;
} | { error: string } {
  if (character.combat.hpCurrent > 0) {
    return { error: "Las salvaciones de muerte solo aplican a 0 PV." };
  }

  const built = tiradaSalvacion(
    0,
    "wis",
    rollMode,
    character.combat.conditionIds,
    character.combat.exhaustionLevel,
    options,
  );
  if ("autoFallo" in built) {
    return { error: built.razon };
  }
  const roll = built;
  const natural = roll.used;

  if (natural === 20) {
    const despierto = resetearSalvacionesMuerte({
      ...character.combat,
      hpCurrent: 1,
      conditionIds: character.combat.conditionIds.filter((id) => id !== "unconscious"),
    });
    const combat = aplicarAgotamientoAlRecuperarPg(despierto);
    return {
      character: { ...character, combat },
      roll,
      outcome: "critical_success",
      message:
        combat.exhaustionLevel >= 6
          ? "¡20 natural! Te levantas… y mueres por agotamiento 6."
          : "¡20 natural! Te levantas con 1 PV (ganas 1 nivel de agotamiento).",
    };
  }

  if (natural === 1) {
    const { combat, outcome } = registrarFalloSalvacionMuerte(character.combat, 2);
    return {
      character: { ...character, combat },
      roll,
      outcome: "critical_failure",
      message:
        outcome === "dead"
          ? "¡1 natural! Dos fallos — estás muerto."
          : "¡1 natural! Dos fallos de salvación.",
    };
  }

  const success = roll.total >= 10;
  if (success) {
    const successes = Math.min(3, character.combat.deathSaves.successes + 1);
    const combat = {
      ...character.combat,
      deathSaves: { ...character.combat.deathSaves, successes },
    };
    if (successes >= 3) {
      return {
        character: { ...character, combat },
        roll,
        outcome: "stable",
        message: "Tres éxitos — quedas estable (0 PV, inconsciente).",
      };
    }
    return {
      character: { ...character, combat },
      roll,
      outcome: "success",
      message: `Éxito (${successes}/3).`,
    };
  }

  const { combat, outcome } = registrarFalloSalvacionMuerte(character.combat, 1);
  return {
    character: { ...character, combat },
    roll,
    outcome: outcome === "dead" ? "dead" : "failure",
    message:
      outcome === "dead"
        ? "Tres fallos — estás muerto."
        : `Fallo (${combat.deathSaves.failures}/3).`,
  };
}
