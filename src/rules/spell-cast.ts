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
import { idsConjurosOtorgadosPreparados } from "@/rules/spell-grants";
import { conjuroEsRitual, conjuroRequiereConcentracion } from "@/rules/spell-meta";
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
  | { tipo: "pact"; level: number; restantes: number; max: number }
  | { tipo: "ritual" };

const CLASES_RITUAL_PREPARADO = new Set(["bard", "cleric", "druid"]);

/** PHB 2024: bardo/clérigo/druida ritualizan preparados; mago, los del grimorio. */
export function puedeLanzarComoRitual(
  character: Character,
  spellId: string | null | undefined,
): boolean {
  if (!spellId || !conjuroEsRitual(spellId)) return false;
  const spell = srdSpells.find((s) => s.id === spellId);
  if ((spell?.level ?? 1) <= 0) return false;
  const classes = clasesParaConjuros(character);
  const preparado =
    character.spells.spellsPrepared.includes(spellId) ||
    idsConjurosOtorgadosPreparados(character).has(spellId);
  const enGrimorio = character.spells.spellsKnown.includes(spellId);
  const ritualPreparado = classes.some((c) => CLASES_RITUAL_PREPARADO.has(c.classId));
  const ritualMago = classes.some((c) => c.classId === "wizard");
  if (ritualPreparado && preparado) return true;
  if (ritualMago && (enGrimorio || preparado)) return true;
  return false;
}

function opcionRitual(character: Character, spellId?: string): OpcionRanuraConjuro | null {
  return spellId && puedeLanzarComoRitual(character, spellId) ? { tipo: "ritual" } : null;
}

/** Espacios (y pacto/ritual) con los que se puede lanzar un conjuro de ese nivel, incluido upcast. */
export function opcionesRanuraConjuro(
  character: Character,
  spellLevel: number,
  spellId?: string,
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
  const ritual = opcionRitual(preparado, spellId);

  // Magia de pacto: todos los espacios son del mismo nivel; no hay upcast a elegir.
  if (esSoloMagiaPacto(preparado)) {
    return [pacto, ritual].filter((o): o is OpcionRanuraConjuro => o !== null);
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
  if (ritual) opciones.push(ritual);
  return opciones;
}

function opcionesPagadas(opciones: OpcionRanuraConjuro[]): OpcionRanuraConjuro[] {
  return opciones.filter((o) => o.tipo !== "ritual");
}

/** Ranura a usar sin preguntar (brujo solo, o una sola opción de espacio). El ritual se elige. */
export function ranuraAutomaticaConjuro(
  character: Character,
  spellLevel: number,
  spellId?: string,
): OpcionRanuraConjuro | undefined {
  const opciones = opcionesRanuraConjuro(character, spellLevel, spellId);
  if (esSoloMagiaPacto(character)) {
    return opciones.find((o) => o.tipo === "pact") ?? opcionesPagadas(opciones)[0];
  }
  const pagadas = opcionesPagadas(opciones);
  return pagadas.length === 1 && !opciones.some((o) => o.tipo === "ritual")
    ? pagadas[0]
    : undefined;
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
  const conCuracion = `${conInv}${sufijoModificador(extraCuracionAtributo(character, spellId))}`;
  const proyectiles = proyectilesConjuro(
    spellId,
    nivelBase,
    nivelRanura,
    character.identity.level,
  );
  if (proyectiles > 1 && conCuracion) return `${proyectiles}×${conCuracion}`;
  return conCuracion;
}

export function etiquetaOpcionRanura(opcion: OpcionRanuraConjuro): string {
  if (opcion.tipo === "ritual") return "Ritual";
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

/** Curaciones 2024 que suman el modificador de lanzamiento. Prayer of Healing no. */
const CURACION_CON_ATRIBUTO = new Set([
  "cure-wounds",
  "healing-word",
  "mass-cure-wounds",
  "mass-healing-word",
]);

function sufijoModificador(valor: number): string {
  if (valor === 0) return "";
  return valor > 0 ? `+${valor}` : `${valor}`;
}

export function extraCuracionAtributo(
  character: Character,
  spellId: string | null | undefined,
  abilityKey?: AbilityKey | null,
): number {
  if (!spellId || !CURACION_CON_ATRIBUTO.has(spellId)) return 0;
  const key = abilityKey ?? inferirAtributoConjuro(character);
  if (!key) return 0;
  return modificadorAtributo(character.abilities[key]);
}

function conExtraAlTotal(
  damage: TiradaDañoConjuro | null,
  extra: number,
): TiradaDañoConjuro | null {
  if (!damage || extra === 0) return damage;
  return {
    ...damage,
    total: damage.total + extra,
    formula: `${damage.formula}${sufijoModificador(extra)}`,
  };
}

function aplicarDañoAgonizante(
  character: Character,
  spellId: string | null | undefined,
  damage: TiradaDañoConjuro | null,
): TiradaDañoConjuro | null {
  if (!damage || !spellId) return damage;
  return conExtraAlTotal(damage, extraDañoAgonizante(character, spellId));
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
    /** Sin espacio; +10 min. */
    usarRitual?: boolean;
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
    const conCuracion = conExtraAlTotal(
      base,
      extraCuracionAtributo(preparado, opts?.spellId, abilityKey),
    );
    return aplicarDañoAgonizante(preparado, opts?.spellId, conCuracion);
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

  if (spellLevel > 0 && opts?.usarRitual) {
    if (!puedeLanzarComoRitual(preparado, opts.spellId)) {
      return { ok: false, error: "Ese conjuro no se puede lanzar como ritual.", cd };
    }
    return {
      ok: true,
      character: activarConcentracion(preparado, opts.spellId, opts.requiereConcentracion),
      roll,
      castType,
      saveAbility,
      damage: dañoEn(spellLevel),
      slotGastado: "Ritual",
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
