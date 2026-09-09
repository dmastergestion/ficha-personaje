import type { AbilityKey, SpellSlotLevel } from "@/lib/constants";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import type { RollMode, D20Roll, DiceRollOptions } from "@/rules/dice";
import { tiradaAtaque } from "@/rules/effects";
import { ajustarEspacioUsado, ajustarPactoUsado } from "@/rules/rests";
import { ajustarRecurso } from "@/rules/resources-tracker";
import {
  atributoConjuroPredeterminado,
} from "@/rules/spell-lists";
import {
  clasesParaConjuros,
  espaciosMaximosPersonaje,
  espaciosPactoMaximos,
  esSoloMagiaPacto,
  nivelEfectivoConjuro,
  nivelEspacioPacto,
} from "@/rules/spells";
import { srdSpells } from "@/rules/srd";
import { conjuroRequiereConcentracion } from "@/rules/spell-meta";
import {
  metaTiradaConjuro,
  textoDadosDañoConjuro,
  tirarDañoConjuro,
  type SpellCastMeta,
  type SpellCastType,
  type TiradaDañoConjuro,
} from "@/rules/spell-cast-meta";
import { extraDañoAgonizante, textoDañoConjuroConInvocaciones } from "@/rules/invocations";
import { llevaArmaduraSinAdiestramiento } from "@/rules/proficiencies";
import { proyectilesConjuro } from "@/rules/spell-upcast-text";
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

export function cdConjuroParaAtributo(character: Character, abilityKey: AbilityKey): number {
  return (
    8 +
    bonificadorCompetencia(character.identity.level) +
    modificadorAtributo(character.abilities[abilityKey])
  );
}

export function modificadorAtaqueConjuroParaAtributo(
  character: Character,
  abilityKey: AbilityKey,
): number {
  return (
    modificadorAtributo(character.abilities[abilityKey]) +
    bonificadorCompetencia(character.identity.level)
  );
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

export type OpcionRanuraConjuro =
  | { tipo: "slot"; level: SpellSlotLevel; restantes: number; max: number }
  | { tipo: "pact"; level: number; restantes: number; max: number };

/** Espacios (y pacto) con los que se puede lanzar un conjuro de ese nivel, incluido upcast. */
export function opcionesRanuraConjuro(
  character: Character,
  spellLevel: number,
): OpcionRanuraConjuro[] {
  if (spellLevel <= 0) return [];
  const preparado = prepararPersonajeConjuro(character);
  const classes = clasesParaConjuros(preparado);
  const pactMax = espaciosPactoMaximos(classes);
  const pactUsed = Number(preparado.spells.pactMagicUsed ?? 0) || 0;
  const pactSlotLevel = nivelEspacioPacto(classes);
  const pacto =
    pactMax > 0 && pactUsed < pactMax && spellLevel <= pactSlotLevel
      ? ({
          tipo: "pact" as const,
          level: pactSlotLevel,
          restantes: pactMax - pactUsed,
          max: pactMax,
        } satisfies OpcionRanuraConjuro)
      : null;

  // Magia de pacto: todos los espacios son del mismo nivel; no hay upcast a elegir.
  if (esSoloMagiaPacto(preparado)) {
    return pacto ? [pacto] : [];
  }

  const max = espaciosMaximosPersonaje(preparado);
  const used = slotsUsadosNormalizados(preparado);
  const opciones: OpcionRanuraConjuro[] = [];

  for (const slotLevel of SPELL_SLOT_LEVELS) {
    if (Number(slotLevel) < spellLevel) continue;
    if (max[slotLevel] <= 0) continue;
    const restantes = max[slotLevel] - used[slotLevel];
    if (restantes > 0) {
      opciones.push({ tipo: "slot", level: slotLevel, restantes, max: max[slotLevel] });
    }
  }

  if (pacto) opciones.push(pacto);
  return opciones;
}

/** Ranura a usar sin preguntar (brujo solo, o una sola opción). */
export function ranuraAutomaticaConjuro(
  character: Character,
  spellLevel: number,
): OpcionRanuraConjuro | undefined {
  const opciones = opcionesRanuraConjuro(character, spellLevel);
  if (esSoloMagiaPacto(character)) {
    return opciones.find((o) => o.tipo === "pact") ?? opciones[0];
  }
  return opciones.length === 1 ? opciones[0] : undefined;
}

/** Dados de daño en ficha: el brujo muestra el upcast al nivel de pacto. */
export function textoDañoMostradoConjuro(
  character: Character,
  spellId: string,
  damage: NonNullable<SpellCastMeta["damage"]>,
  nivelBaseConjuro?: number,
): string {
  const nivelBase = nivelBaseConjuro ?? srdSpells.find((s) => s.id === spellId)?.level ?? 0;
  const classes = clasesParaConjuros(character);
  const nivelRanura =
    esSoloMagiaPacto(character) && nivelBase > 0 ? nivelEspacioPacto(classes) : nivelBase;
  const dados =
    textoDadosDañoConjuro(damage, nivelBase, nivelRanura, character.identity.level) ??
    (typeof damage.dice === "string" ? damage.dice : "");
  const conInv = textoDañoConjuroConInvocaciones(character, spellId, dados);
  const proyectiles = proyectilesConjuro(
    spellId,
    nivelBase,
    nivelRanura,
    character.identity.level,
  );
  if (proyectiles > 1 && conInv) return `${proyectiles}×${conInv}`;
  return conInv;
}

export function etiquetaOpcionRanura(opcion: OpcionRanuraConjuro): string {
  if (opcion.tipo === "pact") {
    return `Pacto ${opcion.level} (${opcion.restantes})`;
  }
  return `Niv. ${opcion.level} (${opcion.restantes})`;
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

function aplicarDañoAgonizante(
  character: Character,
  spellId: string | null | undefined,
  damage: TiradaDañoConjuro | null,
): TiradaDañoConjuro | null {
  if (!damage || !spellId) return damage;
  const extra = extraDañoAgonizante(character, spellId);
  if (extra === 0) return damage;
  const signo = extra > 0 ? `+${extra}` : `${extra}`;
  return { ...damage, total: damage.total + extra, formula: `${damage.formula}${signo}` };
}

export function lanzarConjuro(
  character: Character,
  spellLevel: number,
  rollMode: RollMode,
  opts?: {
    spellId?: string | null;
    requiereConcentracion?: boolean;
    diceOptions?: DiceRollOptions;
    abilityKeyOverride?: AbilityKey;
    featResourceId?: string;
    /** Ranura concreta (upcast). Si falta, se usa la más baja disponible. */
    slotLevel?: SpellSlotLevel;
    usarPacto?: boolean;
  },
): LanzarConjuroResult {
  const preparado = prepararPersonajeConjuro(character);
  if (llevaArmaduraSinAdiestramiento(preparado)) {
    return {
      ok: false,
      error: "No puedes lanzar conjuros con armadura o escudo sin adiestramiento.",
      cd: inferirAtributoConjuro(preparado)
        ? cdConjuroParaAtributo(preparado, inferirAtributoConjuro(preparado)!)
        : cdConjuro(preparado),
    };
  }
  const abilityKey = opts?.abilityKeyOverride ?? inferirAtributoConjuro(preparado);
  const cd = abilityKey ? cdConjuroParaAtributo(preparado, abilityKey) : cdConjuro(preparado);
  const mod = abilityKey ? modificadorAtaqueConjuroParaAtributo(preparado, abilityKey) : modificadorAtaqueConjuro(preparado);

  const spell = opts?.spellId ? srdSpells.find((s) => s.id === opts.spellId) : undefined;
  const meta = metaTiradaConjuro(opts?.spellId, spell);
  const castType = meta.tipo;
  const saveAbility = castType === "save" ? (meta.save ?? null) : null;
  const nivelPersonaje = preparado.identity.level;

  const dañoEn = (nivelRanura: number): TiradaDañoConjuro | null => {
    const base = meta.damage
      ? tirarDañoConjuro(meta.damage, spellLevel, nivelRanura, nivelPersonaje)
      : null;
    return aplicarDañoAgonizante(preparado, opts?.spellId, base);
  };

  // Solo los conjuros de ataque tiran un d20; el resto gasta el espacio sin tirada.
  let roll: D20Roll | null = null;
  if (castType === "attack") {
    if (mod === null) {
      return {
        ok: false,
        error: "No hay atributo de conjuro. Configura la dote o añade una clase lanzadora.",
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

  if (spellLevel > 0 && opts?.featResourceId) {
    const resource = preparado.resources.find((r) => r.id === opts.featResourceId);
    if (resource && resource.used < resource.max) {
      const updated = activarConcentracion(
        ajustarRecurso(preparado, opts.featResourceId, 1),
        opts?.spellId,
        opts?.requiereConcentracion,
      );
      return {
        ok: true,
        character: updated,
        roll,
        castType,
        saveAbility,
        damage: dañoEn(spellLevel),
        slotGastado: resource.name,
        cd,
      };
    }
  }

  const classes = clasesParaConjuros(preparado);
  const pactMax = espaciosPactoMaximos(classes);
  const pactUsed = Number(preparado.spells.pactMagicUsed ?? 0) || 0;
  const pactSlotLevel = nivelEspacioPacto(classes);

  if (opts?.usarPacto) {
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
        slotGastado: `Pacto niv. ${pactSlotLevel}`,
        cd,
      };
    }
    return {
      ok: false,
      error: mensajeSinEspacios(preparado, spellLevel),
      cd,
    };
  }

  if (!esSoloMagiaPacto(preparado) && nivelEfectivoConjuro(classes) > 0) {
    const slotPedido = opts?.slotLevel;
    const slot =
      slotPedido && Number(slotPedido) >= spellLevel
        ? (() => {
            const max = espaciosMaximosPersonaje(preparado);
            const used = slotsUsadosNormalizados(preparado);
            return used[slotPedido] < max[slotPedido] ? slotPedido : null;
          })()
        : encontrarEspacioParaConjuro(preparado, spellLevel);
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
    if (slotPedido) {
      return {
        ok: false,
        error: `Sin espacios de nivel ${slotPedido}.`,
        cd,
      };
    }
  }

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
        slotGastado: `Pacto niv. ${pactSlotLevel}`,
      cd,
    };
  }

  return {
    ok: false,
    error: mensajeSinEspacios(preparado, spellLevel),
    cd,
  };
}
