import type { AbilityKey } from "@/lib/constants";
import spellMetaJson from "@/data/srd/spell-meta.json";
import { conjuroEsRitual } from "@/rules/spell-meta";
import type { SrdSpell } from "@/rules/srd";

export type SpellCastType = "attack" | "save" | "none";

export interface SpellDamage {
  dice: string;
  type?: string;
  scalePerSlot?: string;
  cantripScaling?: boolean;
}

export interface SpellCastMeta {
  tipo: SpellCastType;
  save?: AbilityKey;
  damage?: SpellDamage;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  ritual?: boolean;
  description?: string;
  areaTags?: string[];
}

interface SpellMetaRow {
  castType: SpellCastType;
  save?: AbilityKey;
  damage?: SpellDamage;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  ritual?: boolean;
  description?: string;
  areaTags?: string[];
}

const SPELL_META = spellMetaJson as Record<string, SpellMetaRow>;

function rowToMeta(row: SpellMetaRow): SpellCastMeta {
  return {
    tipo: row.castType,
    save: row.save,
    damage: row.damage,
    castingTime: row.castingTime,
    range: row.range,
    components: row.components,
    duration: row.duration,
    ritual: row.ritual,
    description: row.description,
    areaTags: row.areaTags,
  };
}

function spellToMeta(spell: SrdSpell): SpellCastMeta {
  return {
    tipo: spell.castType ?? "none",
    save: spell.save,
    damage: spell.damage,
    castingTime: spell.castingTime,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    ritual: spell.ritual,
    description: spell.description,
    areaTags: spell.areaTags,
  };
}

/** Tipo de tirada y detalles de un conjuro. Prioriza el catálogo (pack PHB) sobre spell-meta.json. */
export function metaTiradaConjuro(
  spellId: string | null | undefined,
  spell?: SrdSpell | null,
): SpellCastMeta {
  const ritual = conjuroEsRitual(spellId, spell);

  if (spell?.castType || spell?.damage || spell?.description) {
    const base = spellId && SPELL_META[spellId] ? rowToMeta(SPELL_META[spellId]!) : { tipo: "none" as const };
    const fromSpell = spellToMeta(spell);
    return {
      tipo: fromSpell.tipo !== "none" ? fromSpell.tipo : base.tipo,
      save: fromSpell.save ?? base.save,
      damage: fromSpell.damage ?? base.damage,
      castingTime: fromSpell.castingTime ?? base.castingTime,
      range: fromSpell.range ?? base.range,
      components: fromSpell.components ?? base.components,
      duration: fromSpell.duration ?? base.duration,
      ritual: ritual || fromSpell.ritual || base.ritual,
      description: fromSpell.description ?? base.description,
      areaTags: fromSpell.areaTags ?? base.areaTags,
    };
  }

  const base = spellId && SPELL_META[spellId] ? rowToMeta(SPELL_META[spellId]!) : { tipo: "none" as const };
  return { ...base, ritual: ritual || base.ritual };
}

export interface TiradaDañoConjuro {
  rolls: number[];
  total: number;
  formula: string;
  type?: string;
}

function parseDados(expr: string): { count: number; sides: number } | null {
  const m = /^(\d+)d(\d+)$/i.exec(expr.trim());
  if (!m) return null;
  return { count: Number(m[1]), sides: Number(m[2]) };
}

function escalonTruco(nivelPersonaje: number): number {
  return (
    1 +
    (nivelPersonaje >= 5 ? 1 : 0) +
    (nivelPersonaje >= 11 ? 1 : 0) +
    (nivelPersonaje >= 17 ? 1 : 0)
  );
}

export function tirarDañoConjuro(
  damage: SpellDamage,
  nivelBaseConjuro: number,
  nivelRanura: number,
  nivelPersonaje: number,
): TiradaDañoConjuro | null {
  const base = parseDados(damage.dice);
  if (!base) return null;

  let count = base.count;
  if (damage.cantripScaling) {
    count = base.count * escalonTruco(nivelPersonaje);
  } else if (damage.scalePerSlot) {
    const escala = parseDados(damage.scalePerSlot);
    const nivelesExtra = Math.max(0, nivelRanura - nivelBaseConjuro);
    if (escala) count += escala.count * nivelesExtra;
  }

  const rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * base.sides) + 1;
    rolls.push(r);
    total += r;
  }

  return { rolls, total, formula: `${count}d${base.sides}`, type: damage.type };
}

const ETIQUETA: Record<SpellCastType, string> = {
  attack: "Ataque",
  save: "Salvación",
  none: "Sin tirada",
};

export function etiquetaTipoConjuro(tipo: SpellCastType): string {
  return ETIQUETA[tipo];
}

const ABILITY_LABEL_3: Record<AbilityKey, string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

export function etiquetaSalvacion(save: AbilityKey): string {
  return ABILITY_LABEL_3[save];
}

/** Cobertura de metadatos generados (340 conjuros SRD). */
export function estadisticasMetaConjuros(): {
  total: number;
  conDaño: number;
  ataques: number;
  salvaciones: number;
} {
  const rows = Object.values(SPELL_META);
  return {
    total: rows.length,
    conDaño: rows.filter((r) => r.damage).length,
    ataques: rows.filter((r) => r.castType === "attack").length,
    salvaciones: rows.filter((r) => r.castType === "save").length,
  };
}
