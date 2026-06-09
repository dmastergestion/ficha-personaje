import type { AbilityKey, SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import type { RollMode, D20Roll, DiceRollOptions } from "@/rules/dice";
import { tiradaAtaque } from "@/rules/effects";
import { ajustarEspacioUsado, ajustarPactoUsado } from "@/rules/rests";
import {
  atributoConjuroPredeterminado,
} from "@/rules/spell-lists";
import {
  clasesParaConjuros,
  espaciosMaximosPersonaje,
  espaciosPactoMaximos,
  nivelEfectivoConjuro,
  nivelEspacioPacto,
} from "@/rules/spells";
import { srdSpells } from "@/rules/srd";
import { conjuroRequiereConcentracion } from "@/rules/spell-meta";
import { metaTiradaConjuro, tirarDañoConjuro, type SpellCastType, type TiradaDañoConjuro } from "@/rules/spell-cast-meta";
import type { Character } from "@/schemas/character";

function activarConcentracion(
  character: Character,
  spellId: string | null | undefined,
  explicit?: boolean,
): Character {
  const spell = spellId ? srdSpells.find((s) => s.id === spellId) : undefined;
  const necesita =
    explicit === true ||
    conjuroRequiereConcentracion(spellId, spell);
  if (!necesita || !spellId) return character;
  return {
    ...character,
    spells: { ...character.spells, concentratingOn: spellId },
  };
}

function slotsUsadosNormalizados(
  character: Character,
): Character["spells"]["spellSlotsUsed"] {
  const max = espaciosMaximosPersonaje(character);
  return Object.fromEntries(
    SPELL_SLOT_LEVELS.map((level) => {
      const raw = character.spells.spellSlotsUsed[level];
      const used = Number(raw);
      const safe = Number.isFinite(used) ? used : 0;
      return [level, Math.min(max[level], Math.max(0, safe))];
    }),
  ) as Character["spells"]["spellSlotsUsed"];
}

export function inferirAtributoConjuro(character: Character): AbilityKey | null {
  if (character.spells.abilityKey) return character.spells.abilityKey;
  return atributoConjuroPredeterminado(character);
}

export function prepararPersonajeConjuro(character: Character): Character {
  const abilityKey =
    character.spells.abilityKey ?? atributoConjuroPredeterminado(character);
  return {
    ...character,
    spells: {
      ...character.spells,
      abilityKey: abilityKey ?? character.spells.abilityKey,
      spellSlotsUsed: slotsUsadosNormalizados(character),
      pactMagicUsed: character.spells.pactMagicUsed ?? 0,
    },
  };
}

export function cdConjuro(character: Character): number | null {
  const key = inferirAtributoConjuro(character);
  if (!key) return null;
  return (
    8 +
    bonificadorCompetencia(character.identity.level) +
    modificadorAtributo(character.abilities[key])
  );
}

export function modificadorAtaqueConjuro(character: Character): number | null {
  const key = inferirAtributoConjuro(character);
  if (!key) return null;
  return (
    modificadorAtributo(character.abilities[key]) +
    bonificadorCompetencia(character.identity.level)
  );
}

function encontrarEspacioParaConjuro(
  character: Character,
  spellLevel: number,
): SpellSlotLevel | null {
  const max = espaciosMaximosPersonaje(character);
  const used = slotsUsadosNormalizados(character);

  for (const slotLevel of SPELL_SLOT_LEVELS) {
    if (Number(slotLevel) < spellLevel) continue;
    if (used[slotLevel] < max[slotLevel]) {
      return slotLevel;
    }
  }
  return null;
}

function mensajeSinEspacios(character: Character, spellLevel: number): string {
  const max = espaciosMaximosPersonaje(character);
  const used = slotsUsadosNormalizados(character);
  const classes = clasesParaConjuros(character);
  const pactMax = espaciosPactoMaximos(classes);
  const pactUsed = Number(character.spells.pactMagicUsed ?? 0) || 0;

  const detalle = SPELL_SLOT_LEVELS.filter((level) => Number(level) >= spellLevel && max[level] > 0)
    .map((level) => {
      const restantes = max[level] - used[level];
      return `niv.${level}: ${restantes}/${max[level]}`;
    })
    .join(", ");

  if (pactMax > 0) {
    return `Sin espacios de conjuro (necesitas niv.${spellLevel}+). ${detalle || "Sin tabla de espacios"}. Pacto: ${pactUsed}/${pactMax}.`;
  }

  return `Sin espacios de conjuro (necesitas niv.${spellLevel}+). ${detalle || "Sin espacios en tu tabla de conjuros"}.`;
}

export type LanzarConjuroResult =
  | {
      ok: true;
      character: Character;
      roll: D20Roll | null;
      castType: SpellCastType;
      saveAbility: AbilityKey | null;
      damage: TiradaDañoConjuro | null;
      slotGastado?: string;
      cd: number | null;
    }
  | { ok: false; error: string; cd: number | null };

export function lanzarConjuro(
  character: Character,
  spellLevel: number,
  rollMode: RollMode,
  opts?: { spellId?: string | null; requiereConcentracion?: boolean; diceOptions?: DiceRollOptions },
): LanzarConjuroResult {
  const preparado = prepararPersonajeConjuro(character);
  const cd = cdConjuro(preparado);
  const mod = modificadorAtaqueConjuro(preparado);

  const spell = opts?.spellId ? srdSpells.find((s) => s.id === opts.spellId) : undefined;
  const meta = metaTiradaConjuro(opts?.spellId, spell);
  const castType = meta.tipo;
  const saveAbility = castType === "save" ? (meta.save ?? null) : null;
  const nivelPersonaje = preparado.identity.level;

  const dañoEn = (nivelRanura: number): TiradaDañoConjuro | null =>
    meta.damage ? tirarDañoConjuro(meta.damage, spellLevel, nivelRanura, nivelPersonaje) : null;

  // Solo los conjuros de ataque tiran un d20; el resto gasta el espacio sin tirada.
  let roll: D20Roll | null = null;
  if (castType === "attack") {
    if (mod === null) {
      return {
        ok: false,
        error: "No hay atributo de conjuro. Añade una clase lanzadora en Resumen.",
        cd,
      };
    }
    const rollResult = tiradaAtaque(
      mod,
      rollMode,
      preparado.combat.conditionIds,
      preparado.combat.exhaustionLevel,
      opts?.diceOptions,
    );
    if ("error" in rollResult) {
      return { ok: false, error: rollResult.error, cd };
    }
    roll = rollResult;
  }

  if (spellLevel === 0) {
    return {
      ok: true,
      character: activarConcentracion(preparado, opts?.spellId, opts?.requiereConcentracion),
      roll,
      castType,
      saveAbility,
      damage: dañoEn(0),
      cd,
    };
  }

  const classes = clasesParaConjuros(preparado);
  if (nivelEfectivoConjuro(classes) > 0) {
    const slot = encontrarEspacioParaConjuro(preparado, spellLevel);
    if (slot) {
      const updated = activarConcentracion(
        ajustarEspacioUsado(preparado, slot, 1),
        opts?.spellId,
        opts?.requiereConcentracion,
      );
      return {
        ok: true,
        character: updated,
        roll,
        castType,
        saveAbility,
        damage: dañoEn(Number(slot)),
        slotGastado: `Espacio niv. ${slot}`,
        cd,
      };
    }
  }

  const pactMax = espaciosPactoMaximos(classes);
  const pactUsed = Number(preparado.spells.pactMagicUsed ?? 0) || 0;
  const pactSlotLevel = nivelEspacioPacto(classes);
  if (pactMax > 0 && pactUsed < pactMax && spellLevel <= pactSlotLevel) {
    const updated = activarConcentracion(
      ajustarPactoUsado(preparado, 1),
      opts?.spellId,
      opts?.requiereConcentracion,
    );
    return {
      ok: true,
      character: updated,
      roll,
      castType,
      saveAbility,
      damage: dañoEn(pactSlotLevel),
      slotGastado: "Espacio de pacto",
      cd,
    };
  }

  return {
    ok: false,
    error: mensajeSinEspacios(preparado, spellLevel),
    cd,
  };
}
