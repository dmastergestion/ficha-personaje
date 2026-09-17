/**
 * Gastar un uso y aplicar el efecto (curar, espacios, PG temp, rabia…).
 * Contadores: resources-tracker.ts. IDs: resource-ids.ts. PV máximos: resources.ts.
 */
import { SPELL_SLOT_LEVELS, type SpellSlotLevel } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { aplicarCambioPv } from "@/rules/combat-hp";
import { tirarDadoDenominacion } from "@/rules/dice";
import {
  ARCANE_RECOVERY_RESOURCE_ID,
  ELDRITCH_MASTER_RESOURCE_ID,
  FOCUS_POINTS_RESOURCE_ID,
  LAY_ON_HANDS_RESOURCE_ID,
  MAGICAL_CUNNING_RESOURCE_ID,
  PERSISTENT_RAGE_RESOURCE_ID,
  RAGE_RESOURCE_ID,
  SECOND_WIND_RESOURCE_ID,
  SORCEROUS_RESTORATION_RESOURCE_ID,
  UNCANNY_METABOLISM_RESOURCE_ID,
  WILD_RESURGENCE_SLOT_ID,
} from "@/rules/resource-ids";
import {
  ajustarEspacioUsado,
  ajustarPactoUsado,
  espaciosUsadosSeguros,
  pactoRestante,
} from "@/rules/rests";
import { ajustarRecurso, poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { espaciosMaximosPersonaje, espaciosPactoMaximos } from "@/rules/spells";
import {
  esArbolDelMundo,
  esCorazonSalvaje,
  opcionRabiaCorazonSalvaje,
  textoOpcionRabia,
  WILD_HEART_RAGE_KEY,
  type WildHeartRageOption,
} from "@/rules/wild-heart";
import { WILD_SHAPE_RESOURCE_ID } from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";

export type ResultadoRecursoClase =
  | { ok: true; character: Character; mensaje: string }
  | { ok: false; error: string };

export {
  ARCANE_RECOVERY_RESOURCE_ID,
  ELDRITCH_MASTER_RESOURCE_ID,
  FOCUS_POINTS_RESOURCE_ID,
  HEALING_LIGHT_RESOURCE_ID,
  LAY_ON_HANDS_RESOURCE_ID,
  MAGICAL_CUNNING_RESOURCE_ID,
  PERSISTENT_RAGE_RESOURCE_ID,
  RAGE_RESOURCE_ID,
  SECOND_WIND_RESOURCE_ID,
  SORCEROUS_RESTORATION_RESOURCE_ID,
  SORCERY_POINTS_RESOURCE_ID,
  TIRELESS_RESOURCE_ID,
  UNCANNY_METABOLISM_RESOURCE_ID,
  WHOLENESS_RESOURCE_ID,
  WILD_RESURGENCE_SLOT_ID,
} from "@/rules/resource-ids";

const OCULTOS_EN_USOS = new Set<string>([
  MAGICAL_CUNNING_RESOURCE_ID,
  RAGE_RESOURCE_ID,
  WILD_SHAPE_RESOURCE_ID,
  ARCANE_RECOVERY_RESOURCE_ID,
  SORCEROUS_RESTORATION_RESOURCE_ID,
  ELDRITCH_MASTER_RESOURCE_ID,
  WILD_RESURGENCE_SLOT_ID,
]);

export function recursoTerminaEn(id: string, clave: string): boolean {
  return id === clave || id.endsWith(`:${clave}`);
}

/** Recursos con panel propio (Combate o Hechizos); no listarlos como Usar genérico. */
export function recursoOcultoEnPanelUsos(id: string): boolean {
  return OCULTOS_EN_USOS.has(id);
}

export function esCuracionSimple(id: string): boolean {
  return (
    id === SECOND_WIND_RESOURCE_ID ||
    recursoTerminaEn(id, "healing-hands") ||
    recursoTerminaEn(id, "wholeness-of-body") ||
    recursoTerminaEn(id, "fast-healing")
  );
}

export function esCuracionPorPuntos(id: string): boolean {
  return id === LAY_ON_HANDS_RESOURCE_ID || recursoTerminaEn(id, "healing-light");
}

export function maxPuntosPorUso(id: string, restantes: number): number {
  if (recursoTerminaEn(id, "healing-light")) return Math.min(5, restantes);
  return restantes;
}

function nivelClase(character: Character, classId: string): number {
  return character.identity.classes.find((c) => c.classId === classId)?.level ?? 0;
}

function recurso(character: Character, id: string) {
  return character.resources.find((r) => r.id === id);
}

function gastarOError(
  character: Character,
  id: string,
  cantidad: number,
  sinUsos: string,
): Character | { error: string } {
  const r = recurso(character, id);
  if (!r || r.used + cantidad > r.max) return { error: sinUsos };
  return ajustarRecurso(character, id, cantidad);
}

function conOpcionRabia(
  character: Character,
  opcion: WildHeartRageOption | undefined,
): Character {
  if (!opcion || !esCorazonSalvaje(character)) return character;
  return {
    ...character,
    originChoices: {
      ...character.originChoices,
      class: { ...character.originChoices.class, [WILD_HEART_RAGE_KEY]: opcion },
    },
  };
}

/** Activa o termina Rabia. Activar gasta un uso; terminar no lo devuelve. */
export function fijarRabia(
  character: Character,
  activa: boolean,
  opts?: { wildHeart?: WildHeartRageOption },
): ResultadoRecursoClase {
  if (nivelClase(character, "barbarian") < 1) {
    return { ok: false, error: "Rabia requiere niveles de bárbaro." };
  }
  if (!activa) {
    if (!character.combat.raging) return { ok: true, character, mensaje: "" };
    return {
      ok: true,
      character: { ...character, combat: { ...character.combat, raging: false } },
      mensaje: "Terminas la rabia.",
    };
  }
  if (character.combat.raging) return { ok: true, character, mensaje: "" };
  const gastado = gastarOError(
    character,
    RAGE_RESOURCE_ID,
    1,
    "No te quedan usos de Rabia.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };

  const next = conOpcionRabia(gastado, opts?.wildHeart);
  const opcion = opcionRabiaCorazonSalvaje(next);
  let hpTemp = next.combat.hpTemp;
  if (esArbolDelMundo(next)) {
    hpTemp = Math.max(hpTemp, nivelClase(next, "barbarian"));
  }
  const extra = textoOpcionRabia(opcion);
  return {
    ok: true,
    character: {
      ...next,
      combat: { ...next.combat, raging: true, hpTemp },
    },
    mensaje: extra ? `Rabia activa. ${extra}` : "Rabia activa.",
  };
}

/** PHB 2024: acción adicional, recuperas 1d10 + nivel de guerrero PG. */
export function usarSegundoAliento(
  character: Character,
  dado?: number,
): ResultadoRecursoClase {
  const nivel = nivelClase(character, "fighter");
  if (nivel < 1) return { ok: false, error: "Segundo aliento requiere niveles de guerrero." };
  const gastado = gastarOError(
    character,
    SECOND_WIND_RESOURCE_ID,
    1,
    "No te quedan usos de Segundo aliento.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const tirada = dado ?? tirarDadoDenominacion("d10");
  const curacion = tirada + nivel;
  return {
    ok: true,
    character: {
      ...gastado,
      combat: aplicarCambioPv(gastado.combat, curacion),
    },
    mensaje: `Segundo aliento: recuperas ${curacion} PG.`,
  };
}

/** PHB 2024: gasta puntos de la reserva y cura esa cantidad. */
export function usarImposicionManos(
  character: Character,
  puntos: number,
): ResultadoRecursoClase {
  const n = Math.floor(puntos);
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: "Indica cuántos puntos de Imposición gastar." };
  }
  if (nivelClase(character, "paladin") < 1) {
    return { ok: false, error: "Imposición de manos requiere niveles de paladín." };
  }
  const gastado = gastarOError(
    character,
    LAY_ON_HANDS_RESOURCE_ID,
    n,
    "No te quedan suficientes puntos de Imposición de manos.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  return {
    ok: true,
    character: {
      ...gastado,
      combat: aplicarCambioPv(gastado.combat, n),
    },
    mensaje: `Imposición de manos: recuperas ${n} PG.`,
  };
}

/** PHB 2024: hasta la mitad de tus espacios de pacto (redondeando hacia arriba). */
export function espaciosRecuperadosAstuciaMagica(maxPactSlots: number): number {
  if (maxPactSlots <= 0) return 0;
  return Math.ceil(maxPactSlots / 2);
}

/** Ritual de 1 minuto: gasta el uso y recupera espacios de pacto gastados. */
export function usarAstuciaMagica(character: Character): ResultadoRecursoClase {
  const nivel = nivelClase(character, "warlock");
  if (nivel < 2) {
    return { ok: false, error: "Astucia mágica requiere brujo de nivel 2." };
  }
  const preparado = recurso(character, MAGICAL_CUNNING_RESOURCE_ID)
    ? character
    : poblarRecursosSugeridos(character);
  const max = espaciosPactoMaximos(preparado.identity.classes);
  const gastados = Math.max(0, max - pactoRestante(preparado));
  if (gastados <= 0) {
    return { ok: false, error: "No tienes espacios de pacto gastados que recuperar." };
  }
  const recupera = Math.min(gastados, espaciosRecuperadosAstuciaMagica(max));
  const gastado = gastarOError(
    preparado,
    MAGICAL_CUNNING_RESOURCE_ID,
    1,
    "Ya has usado Astucia mágica (1/descanso largo).",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  return {
    ok: true,
    character: ajustarPactoUsado(gastado, -recupera),
    mensaje:
      recupera === 1
        ? "Astucia mágica: recuperas 1 espacio de pacto."
        : `Astucia mágica: recuperas ${recupera} espacios de pacto.`,
  };
}

function conPgTemporales(character: Character, cantidad: number): Character {
  return {
    ...character,
    combat: {
      ...character.combat,
      hpTemp: Math.max(character.combat.hpTemp, Math.max(0, cantidad)),
    },
  };
}

function sumaDados(n: number, die: string, dados?: number[]): number {
  if (dados && dados.length >= n) {
    return dados.slice(0, n).reduce((s, v) => s + v, 0);
  }
  let total = 0;
  for (let i = 0; i < n; i += 1) total += tirarDadoDenominacion(die);
  return total;
}

/** PHB 2024: d6 / d8 (5) / d10 (11) / d12 (17). */
export function dadoArtesMarciales(nivelMonje: number): string {
  if (nivelMonje >= 17) return "d12";
  if (nivelMonje >= 11) return "d10";
  if (nivelMonje >= 5) return "d8";
  return "d6";
}

export type OpcionesUsoRecurso = {
  puntos?: number;
  dados?: number[];
};

/** Gasta el uso y aplica el efecto mecánico (curar, espacios, PG temp…). */
export function usarRecursoFicha(
  character: Character,
  resourceId: string,
  opts?: OpcionesUsoRecurso,
): ResultadoRecursoClase {
  if (resourceId === SECOND_WIND_RESOURCE_ID) {
    const dado = opts?.dados?.[0];
    return usarSegundoAliento(character, dado);
  }
  if (resourceId === LAY_ON_HANDS_RESOURCE_ID) {
    return usarImposicionManos(character, opts?.puntos ?? 1);
  }
  if (resourceId === MAGICAL_CUNNING_RESOURCE_ID) {
    return usarAstuciaMagica(character);
  }
  if (resourceId === ARCANE_RECOVERY_RESOURCE_ID) {
    return usarRecuperacionArcana(character);
  }
  if (resourceId === WILD_RESURGENCE_SLOT_ID) {
    return convertirFormaEnEspacio(character);
  }
  if (resourceId === RAGE_RESOURCE_ID) {
    return fijarRabia(character, true);
  }
  if (resourceId === WILD_SHAPE_RESOURCE_ID) {
    return { ok: false, error: "Elige la bestia en el panel de Forma salvaje." };
  }
  if (recursoTerminaEn(resourceId, "healing-hands")) {
    return usarManosSanadoras(character, resourceId, opts?.dados);
  }
  if (recursoTerminaEn(resourceId, "wholeness-of-body")) {
    return usarPlenitudCuerpo(character, resourceId, opts?.dados?.[0]);
  }
  if (recursoTerminaEn(resourceId, "fast-healing")) {
    return usarCuracionRapida(character, resourceId, opts?.dados?.[0]);
  }
  if (recursoTerminaEn(resourceId, "healing-light")) {
    return usarLuzCurativa(character, resourceId, opts?.puntos ?? 1, opts?.dados);
  }
  if (recursoTerminaEn(resourceId, "tireless")) {
    return usarIncansable(character, resourceId, opts?.dados?.[0]);
  }
  if (recursoTerminaEn(resourceId, "uncanny-metabolism")) {
    return usarMetabolismoAsombroso(character, opts?.dados?.[0]);
  }
  if (recursoTerminaEn(resourceId, "persistent-rage")) {
    return usarRabiaPersistente(character);
  }
  if (recursoTerminaEn(resourceId, "adrenaline-rush")) {
    return usarSubidonAdrenalina(character, resourceId);
  }
  if (recursoTerminaEn(resourceId, "relentless-endurance")) {
    return usarAguanteImplicable(character, resourceId);
  }
  if (recursoTerminaEn(resourceId, "treats")) {
    return usarGolosinas(character, resourceId);
  }

  const gastado = gastarOError(character, resourceId, 1, "No te quedan usos.");
  if ("error" in gastado) return { ok: false, error: gastado.error };
  return { ok: true, character: gastado, mensaje: "" };
}

/** PHB 2024: tocas y tiras PBd4 de curación. */
export function usarManosSanadoras(
  character: Character,
  resourceId: string,
  dados?: number[],
): ResultadoRecursoClase {
  const pb = bonificadorCompetencia(character.identity.level);
  const gastado = gastarOError(character, resourceId, 1, "No te quedan usos de Manos sanadoras.");
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const curacion = sumaDados(pb, "d4", dados);
  return {
    ok: true,
    character: { ...gastado, combat: aplicarCambioPv(gastado.combat, curacion) },
    mensaje: `Manos sanadoras: recuperas ${curacion} PG (${pb}d4).`,
  };
}

/** PHB 2024: dado de artes marciales + SAB (mín. 1). */
export function usarPlenitudCuerpo(
  character: Character,
  resourceId: string,
  dado?: number,
): ResultadoRecursoClase {
  const nivel = nivelClase(character, "monk");
  if (nivel < 6) return { ok: false, error: "Plenitud del cuerpo requiere monje de nivel 6." };
  const gastado = gastarOError(character, resourceId, 1, "No te quedan usos de Plenitud del cuerpo.");
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const die = dadoArtesMarciales(nivel);
  const tirada = dado ?? tirarDadoDenominacion(die);
  const curacion = Math.max(1, tirada + modificadorAtributo(character.abilities.wis));
  return {
    ok: true,
    character: { ...gastado, combat: aplicarCambioPv(gastado.combat, curacion) },
    mensaje: `Plenitud del cuerpo: recuperas ${curacion} PG.`,
  };
}

/** Dote Sanador: 1d6 + 4 + dados de golpe máximos. */
export function usarCuracionRapida(
  character: Character,
  resourceId: string,
  dado?: number,
): ResultadoRecursoClase {
  const gastado = gastarOError(
    character,
    resourceId,
    1,
    "Esta criatura ya ha recibido Curación rápida desde el último descanso.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const tirada = dado ?? tirarDadoDenominacion("d6");
  const curacion = tirada + 4 + character.combat.hitDiceTotal;
  return {
    ok: true,
    character: { ...gastado, combat: aplicarCambioPv(gastado.combat, curacion) },
    mensaje: `Curación rápida: recuperas ${curacion} PG.`,
  };
}

/** Reserva de d6 (máx. 5 por uso). */
export function usarLuzCurativa(
  character: Character,
  resourceId: string,
  dadosAGastar: number,
  dados?: number[],
): ResultadoRecursoClase {
  const n = Math.floor(dadosAGastar);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    return { ok: false, error: "Luz curativa gasta entre 1 y 5 dados." };
  }
  const gastado = gastarOError(
    character,
    resourceId,
    n,
    "No te quedan suficientes dados de Luz curativa.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const curacion = sumaDados(n, "d6", dados);
  return {
    ok: true,
    character: { ...gastado, combat: aplicarCambioPv(gastado.combat, curacion) },
    mensaje: `Luz curativa: recuperas ${curacion} PG (${n}d6).`,
  };
}

/** PG temporales 1d8 + SAB. */
export function usarIncansable(
  character: Character,
  resourceId: string,
  dado?: number,
): ResultadoRecursoClase {
  const gastado = gastarOError(character, resourceId, 1, "No te quedan usos de Incansable.");
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const tirada = dado ?? tirarDadoDenominacion("d8");
  const temp = Math.max(0, tirada + modificadorAtributo(character.abilities.wis));
  return {
    ok: true,
    character: conPgTemporales(gastado, temp),
    mensaje: `Incansable: ganas ${temp} PG temporales.`,
  };
}

/** Al iniciativa: recuperas todos los puntos de enfoque y curas nivel + dado marcial. */
export function usarMetabolismoAsombroso(
  character: Character,
  dado?: number,
): ResultadoRecursoClase {
  const nivel = nivelClase(character, "monk");
  if (nivel < 2) return { ok: false, error: "Metabolismo asombroso requiere monje de nivel 2." };
  const gastado = gastarOError(
    character,
    UNCANNY_METABOLISM_RESOURCE_ID,
    1,
    "Ya has usado Metabolismo asombroso (1/descanso largo).",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const enfoque = recurso(gastado, FOCUS_POINTS_RESOURCE_ID);
  let next = gastado;
  if (enfoque && enfoque.used > 0) {
    next = ajustarRecurso(next, FOCUS_POINTS_RESOURCE_ID, -enfoque.used);
  }
  const die = dadoArtesMarciales(nivel);
  const tirada = dado ?? tirarDadoDenominacion(die);
  const curacion = nivel + tirada;
  return {
    ok: true,
    character: { ...next, combat: aplicarCambioPv(next.combat, curacion) },
    mensaje: `Metabolismo asombroso: recuperas el enfoque y ${curacion} PG.`,
  };
}

/** Al iniciativa: recuperas todos los usos de Rabia. */
export function usarRabiaPersistente(character: Character): ResultadoRecursoClase {
  const gastado = gastarOError(
    character,
    PERSISTENT_RAGE_RESOURCE_ID,
    1,
    "Ya has usado Rabia persistente (1/descanso largo).",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const rabia = recurso(gastado, RAGE_RESOURCE_ID);
  const next =
    rabia && rabia.used > 0 ? ajustarRecurso(gastado, RAGE_RESOURCE_ID, -rabia.used) : gastado;
  return {
    ok: true,
    character: next,
    mensaje: "Rabia persistente: recuperas todos los usos de Rabia.",
  };
}

/** Acción adicional Correr: PG temporales = PB. */
export function usarSubidonAdrenalina(
  character: Character,
  resourceId: string,
): ResultadoRecursoClase {
  const gastado = gastarOError(
    character,
    resourceId,
    1,
    "No te quedan usos de Arrebato de adrenalina.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const temp = bonificadorCompetencia(character.identity.level);
  return {
    ok: true,
    character: conPgTemporales(gastado, temp),
    mensaje: `Arrebato de adrenalina: ganas ${temp} PG temporales.`,
  };
}

/** Si caes a 0 PG, quedas con 1. */
export function usarAguanteImplicable(
  character: Character,
  resourceId: string,
): ResultadoRecursoClase {
  const gastado = gastarOError(
    character,
    resourceId,
    1,
    "Ya has usado Aguante implacable (1/descanso largo).",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  if (gastado.combat.hpCurrent > 0) {
    return { ok: true, character: gastado, mensaje: "Aguante implacable gastado." };
  }
  return {
    ok: true,
    character: {
      ...gastado,
      combat: {
        ...gastado.combat,
        hpCurrent: 1,
        conditionIds: gastado.combat.conditionIds.filter((id) => id !== "unconscious"),
        deathSaves: { successes: 0, failures: 0 },
      },
    },
    mensaje: "Aguante implacable: quedas con 1 PG.",
  };
}

/** Dote Cocinero: PG temporales = PB. */
export function usarGolosinas(character: Character, resourceId: string): ResultadoRecursoClase {
  const gastado = gastarOError(character, resourceId, 1, "No te quedan golosinas.");
  if ("error" in gastado) return { ok: false, error: gastado.error };
  const temp = bonificadorCompetencia(character.identity.level);
  return {
    ok: true,
    character: conPgTemporales(gastado, temp),
    mensaje: `Golosina: ganas ${temp} PG temporales.`,
  };
}

export function presupuestoRecuperacionArcana(nivelMago: number): number {
  if (nivelMago < 1) return 0;
  return Math.ceil(nivelMago / 2);
}

/** Recupera espacios gastados de 1.º–5.º cuya suma de niveles ≤ mitad de mago (arriba). */
export function usarRecuperacionArcana(character: Character): ResultadoRecursoClase {
  const nivel = nivelClase(character, "wizard");
  if (nivel < 1) return { ok: false, error: "Recuperación arcana requiere niveles de mago." };
  let presupuesto = presupuestoRecuperacionArcana(nivel);
  const max = espaciosMaximosPersonaje(character);
  const used = espaciosUsadosSeguros(character);
  const niveles: SpellSlotLevel[] = ["1", "2", "3", "4", "5"];
  const hayGastados = niveles.some((lvl) => used[lvl] > 0);
  if (!hayGastados) {
    return { ok: false, error: "No tienes espacios de 1.º a 5.º gastados que recuperar." };
  }

  const gastado = gastarOError(
    character,
    ARCANE_RECOVERY_RESOURCE_ID,
    1,
    "Ya has usado Recuperación arcana (1/descanso largo).",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };

  let next = gastado;
  const recuperados: string[] = [];
  for (const lvl of niveles) {
    const coste = Number(lvl);
    while (espaciosUsadosSeguros(next)[lvl] > 0 && presupuesto >= coste && max[lvl] > 0) {
      next = ajustarEspacioUsado(next, lvl, -1);
      presupuesto -= coste;
      recuperados.push(lvl);
    }
  }
  if (recuperados.length === 0) {
    return {
      ok: false,
      error: "Ningún espacio gastado cabe en el presupuesto de Recuperación arcana.",
    };
  }
  const resumen = contarPorNivel(recuperados);
  return {
    ok: true,
    character: next,
    mensaje: `Recuperación arcana: recuperas ${resumen}.`,
  };
}

function contarPorNivel(niveles: string[]): string {
  const counts = new Map<string, number>();
  for (const n of niveles) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()]
    .map(([lvl, n]) => (n === 1 ? `1 espacio de niv. ${lvl}` : `${n} espacios de niv. ${lvl}`))
    .join(", ");
}

/** Convierte 1 uso de Forma salvaje en 1 espacio de nivel 1 (1/descanso largo). */
export function convertirFormaEnEspacio(character: Character): ResultadoRecursoClase {
  if (nivelClase(character, "druid") < 5) {
    return { ok: false, error: "Resurgimiento salvaje requiere druida de nivel 5." };
  }
  const forma = recurso(character, WILD_SHAPE_RESOURCE_ID);
  if (!forma || forma.used >= forma.max) {
    return { ok: false, error: "No te quedan usos de Forma salvaje que convertir." };
  }
  const max1 = espaciosMaximosPersonaje(character)["1"];
  const used1 = espaciosUsadosSeguros(character)["1"];
  if (max1 <= 0) return { ok: false, error: "No tienes espacios de nivel 1." };
  if (used1 <= 0) {
    return { ok: false, error: "No tienes espacios de nivel 1 gastados que recuperar." };
  }
  const gastado = gastarOError(
    character,
    WILD_RESURGENCE_SLOT_ID,
    1,
    "Ya has convertido un uso de Forma salvaje en espacio hoy.",
  );
  if ("error" in gastado) return { ok: false, error: gastado.error };
  let next = ajustarRecurso(gastado, WILD_SHAPE_RESOURCE_ID, 1);
  next = ajustarEspacioUsado(next, "1", -1);
  return {
    ok: true,
    character: next,
    mensaje: "Resurgimiento salvaje: ganas 1 espacio de nivel 1.",
  };
}

/** Gasta un espacio (el de menor nivel disponible) y recupera 1 uso de Forma salvaje. */
export function recuperarFormaConEspacio(character: Character): ResultadoRecursoClase {
  if (nivelClase(character, "druid") < 5) {
    return { ok: false, error: "Resurgimiento salvaje requiere druida de nivel 5." };
  }
  const forma = recurso(character, WILD_SHAPE_RESOURCE_ID);
  if (!forma || forma.used <= 0) {
    return { ok: false, error: "No tienes usos de Forma salvaje gastados que recuperar." };
  }
  const max = espaciosMaximosPersonaje(character);
  const restantes = Object.fromEntries(
    SPELL_SLOT_LEVELS.map((lvl) => [lvl, Math.max(0, max[lvl] - espaciosUsadosSeguros(character)[lvl])]),
  ) as Record<SpellSlotLevel, number>;
  const nivel = SPELL_SLOT_LEVELS.find((lvl) => restantes[lvl] > 0);
  if (!nivel) return { ok: false, error: "No te quedan espacios de conjuro." };
  let next = ajustarEspacioUsado(character, nivel, 1);
  next = ajustarRecurso(next, WILD_SHAPE_RESOURCE_ID, -1);
  return {
    ok: true,
    character: next,
    mensaje: `Resurgimiento salvaje: recuperas 1 uso de Forma salvaje (espacio niv. ${nivel}).`,
  };
}
