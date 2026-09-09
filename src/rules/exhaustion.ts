import { AGOTAMIENTO_MAX } from "@/rules/edition";
import type { Character } from "@/schemas/character";

/** Aplica nivel de agotamiento; al llegar a 6 (PHB 2024) el personaje muere. */
export function fijarAgotamiento(character: Character, nivel: number): Character {
  const exhaustionLevel = Math.min(AGOTAMIENTO_MAX, Math.max(0, nivel));
  let combat: Character["combat"] = { ...character.combat, exhaustionLevel };

  if (exhaustionLevel >= AGOTAMIENTO_MAX) {
    combat = {
      ...combat,
      hpCurrent: 0,
      hpTemp: 0,
      deathSaves: { successes: 0, failures: 3 },
    };
  }

  return { ...character, combat };
}

/** Suma (o resta) niveles de agotamiento respetando muerte al nivel 6. */
export function ajustarAgotamiento(character: Character, delta: number): Character {
  return fijarAgotamiento(character, character.combat.exhaustionLevel + delta);
}

/** SRD 5.2: al recuperar PG habiendo estado a 0, ganas 1 nivel de agotamiento. */
export function aplicarAgotamientoAlRecuperarPg(
  combat: Character["combat"],
): Character["combat"] {
  const exhaustionLevel = Math.min(AGOTAMIENTO_MAX, combat.exhaustionLevel + 1);
  let next: Character["combat"] = { ...combat, exhaustionLevel };
  if (exhaustionLevel >= AGOTAMIENTO_MAX) {
    next = {
      ...next,
      hpCurrent: 0,
      hpTemp: 0,
      deathSaves: { successes: 0, failures: 3 },
    };
  }
  return next;
}
