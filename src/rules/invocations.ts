import invocationsJson from "@/data/srd/eldritch-invocations.json";
import type { OriginChoiceDefinition, OriginChoices } from "@/rules/origin-choices";
import { conjuroDisponibleParaClase } from "@/rules/spell-lists";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import { modificadorAtributo } from "@/rules/ability";
import { srdSpells, srdWeapons, t, type SrdWeapon } from "@/rules/srd";
import type { Character, ClassLevel } from "@/schemas/character";

export const INVOCATIONS_KEY = "eldritch-invocations";
export const PACT_OF_THE_BLADE_ID = "pact-of-the-blade";
export const PACT_WEAPON_KEY = "pact-weapon";
export const PACT_WEAPON_ATTACK_ID = "pact-weapon";

export const AGONIZING_BLAST_ID = "agonizing-blast";
export const AGONIZING_BLAST_CANTRIP_KEY = "agonizing-blast-cantrip";
export const ELDRITCH_SPEAR_ID = "eldritch-spear";
export const ELDRITCH_SPEAR_CANTRIP_KEY = "eldritch-spear-cantrip";
export const REPELLING_BLAST_ID = "repelling-blast";
export const REPELLING_BLAST_CANTRIP_KEY = "repelling-blast-cantrip";

/** Selecciones que dependen de una invocación (no ocultar al asignar el valor). */
export const KEYS_SEGUIMIENTO_INVOCACION = new Set([
  PACT_WEAPON_KEY,
  AGONIZING_BLAST_CANTRIP_KEY,
  ELDRITCH_SPEAR_CANTRIP_KEY,
  REPELLING_BLAST_CANTRIP_KEY,
]);

export type EldritchInvocation = {
  id: string;
  nameEs: string;
  minLevel: number;
  requires?: string[];
  hint?: string;
};

/** Tabla Invocaciones conocidas (PHB/SRD 2024). */
const MAX_POR_NIVEL: [number, number][] = [
  [1, 1],
  [2, 3],
  [5, 5],
  [7, 6],
  [9, 7],
  [12, 8],
  [15, 9],
  [18, 10],
];

const CATALOGO = invocationsJson as EldritchInvocation[];

export function nivelBrujoClases(classes: ClassLevel[]): number {
  return classes.find((c) => c.classId === "warlock")?.level ?? 0;
}

export function maxInvocaciones(warlockLevel: number): number {
  let max = 0;
  for (const [lvl, value] of MAX_POR_NIVEL) {
    if (warlockLevel >= lvl) max = value;
  }
  return max;
}

export function catalogoInvocaciones(): EldritchInvocation[] {
  return CATALOGO;
}

export function invocacionPorId(id: string): EldritchInvocation | undefined {
  return CATALOGO.find((inv) => inv.id === id);
}

export function parsearInvocaciones(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function serializarInvocaciones(ids: string[]): string {
  return [...new Set(ids)].join(",");
}

export function invocacionesDelNivel(warlockLevel: number): EldritchInvocation[] {
  return CATALOGO.filter((inv) => inv.minLevel <= warlockLevel);
}

export function invocacionesElegibles(
  warlockLevel: number,
  seleccionadas: string[] = [],
): EldritchInvocation[] {
  const tiene = new Set(seleccionadas);
  return invocacionesDelNivel(warlockLevel).filter((inv) =>
    (inv.requires ?? []).every((req) => tiene.has(req)),
  );
}

export function fusionarInvocaciones(
  warlockLevel: number,
  actual: string | undefined,
): string {
  const max = maxInvocaciones(warlockLevel);
  if (max <= 0) return "";
  const ids = parsearInvocaciones(actual);
  const validas = invocacionesElegibles(warlockLevel, ids)
    .map((inv) => inv.id)
    .filter((id) => ids.includes(id));
  return serializarInvocaciones(validas.slice(0, max));
}

export function invocacionesCompletas(
  warlockLevel: number,
  raw: string | undefined,
): boolean {
  const max = maxInvocaciones(warlockLevel);
  if (max <= 0) return true;
  const ids = parsearInvocaciones(fusionarInvocaciones(warlockLevel, raw));
  return ids.length === max;
}

export function alternarInvocacion(
  warlockLevel: number,
  actual: string | undefined,
  id: string,
): string {
  const max = maxInvocaciones(warlockLevel);
  const ids = parsearInvocaciones(fusionarInvocaciones(warlockLevel, actual));
  const set = new Set(ids);
  if (set.has(id)) {
    set.delete(id);
    return serializarInvocaciones(
      parsearInvocaciones(fusionarInvocaciones(warlockLevel, serializarInvocaciones([...set]))),
    );
  }
  if (set.size >= max) return serializarInvocaciones(ids);
  if (!invocacionesElegibles(warlockLevel, ids).some((inv) => inv.id === id)) {
    return serializarInvocaciones(ids);
  }
  set.add(id);
  return serializarInvocaciones([...set]);
}

export function eleccionesInvocaciones(
  classId: string | null,
  classLevel: number,
): OriginChoiceDefinition[] {
  if (classId !== "warlock") return [];
  const max = maxInvocaciones(classLevel);
  if (max <= 0) return [];
  const opciones = invocacionesDelNivel(classLevel).map((inv) => ({
    value: inv.id,
    label: inv.minLevel > 1 ? `${inv.nameEs} (niv. ${inv.minLevel}+)` : inv.nameEs,
  }));
  return [
    {
      id: INVOCATIONS_KEY,
      scope: "class",
      label: "Invocaciones eldritch",
      hint: `Elige ${max} invocación${max > 1 ? "es" : ""} (PHB 2024). Puedes cambiar una al subir de nivel.`,
      options: opciones,
      editable: "always",
      kind: "multi",
      maxSelections: max,
    },
  ];
}

export function tienePactoDeLaHoja(rawOrChoices: string | OriginChoices | undefined): boolean {
  const raw =
    typeof rawOrChoices === "string" ? rawOrChoices : rawOrChoices?.class?.[INVOCATIONS_KEY];
  return parsearInvocaciones(raw).includes(PACT_OF_THE_BLADE_ID);
}

function esArmaMeleePacto(weapon: SrdWeapon): boolean {
  return weapon.category.endsWith("M");
}

export function opcionesArmaPacto(): { value: string; label: string }[] {
  return srdWeapons
    .filter(esArmaMeleePacto)
    .map((w) => ({ value: w.id, label: t("weapons", w.id, w.nameEn) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function armaPactoElegida(choices: OriginChoices | undefined): string | null {
  if (!tienePactoDeLaHoja(choices)) return null;
  const id = choices?.class?.[PACT_WEAPON_KEY];
  const weapon = id ? srdWeapons.find((w) => w.id === id) : undefined;
  if (weapon && esArmaMeleePacto(weapon)) return id ?? null;
  return srdWeapons.some((w) => w.id === "rapier") ? "rapier" : opcionesArmaPacto()[0]?.value ?? null;
}

export function eleccionArmaPacto(invocaciones: string[] | string | undefined): OriginChoiceDefinition[] {
  if (!tienePactoDeLaHoja(typeof invocaciones === "string" ? invocaciones : invocaciones?.join(","))) {
    return [];
  }
  const options = opcionesArmaPacto();
  if (!options.length) return [];
  const rapier = options.find((o) => o.value === "rapier");
  return [
    {
      id: PACT_WEAPON_KEY,
      scope: "class",
      label: "Arma de pacto",
      hint: "Forma que convocas o arma cuerpo a cuerpo a la que te vinculas. Atacas y dañas con Carisma.",
      options,
      defaultValue: rapier?.value ?? options[0]!.value,
      editable: "always",
    },
  ];
}

export type TrucoInvocacion = {
  id: string;
  name: string;
  damage: boolean;
  attack: boolean;
};

export function catalogoTrucosBrujo(): TrucoInvocacion[] {
  return srdSpells
    .filter((s) => s.level === 0 && conjuroDisponibleParaClase(s.id, "warlock", null))
    .map((s) => {
      const meta = metaTiradaConjuro(s.id, s);
      return {
        id: s.id,
        name: t("spells", s.id, s.nameEn),
        damage: Boolean(meta.damage),
        attack: meta.tipo === "attack",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function rawInvocaciones(invocaciones: string[] | string | undefined): string {
  return typeof invocaciones === "string" ? invocaciones : invocaciones?.join(",") ?? "";
}

function opcionesTrucoFiltradas(
  trucos: TrucoInvocacion[],
  conocidos: string[],
  pred: (t: TrucoInvocacion) => boolean,
): { value: string; label: string }[] {
  const matching = trucos.filter(pred);
  const known = matching.filter((t) => conocidos.includes(t.id));
  const pool = known.length > 0 ? known : matching;
  return pool.map((t) => ({ value: t.id, label: t.name }));
}

function defaultTruco(options: { value: string }[], conocidos: string[]): string {
  const known = options.filter((o) => conocidos.includes(o.value));
  const pool = known.length > 0 ? known : options;
  return pool.find((o) => o.value === "eldritch-blast")?.value ?? pool[0]?.value ?? "";
}

const ELECCIONES_TRUCO: {
  invId: string;
  key: string;
  label: string;
  hint: string;
  pred: (t: TrucoInvocacion) => boolean;
}[] = [
  {
    invId: AGONIZING_BLAST_ID,
    key: AGONIZING_BLAST_CANTRIP_KEY,
    label: "Truco de Descarga agonizante",
    hint: "Truco de brujo que inflige daño. Añades tu modificador de Carisma a una tirada de daño de ese truco.",
    pred: (t) => t.damage,
  },
  {
    invId: ELDRITCH_SPEAR_ID,
    key: ELDRITCH_SPEAR_CANTRIP_KEY,
    label: "Truco de Lanza sobrenatural",
    hint: "Truco de brujo que exige tirada de ataque. Su alcance aumenta 30 pies × tu nivel de brujo.",
    pred: (t) => t.attack,
  },
  {
    invId: REPELLING_BLAST_ID,
    key: REPELLING_BLAST_CANTRIP_KEY,
    label: "Truco de Descarga repelente",
    hint: "Truco de brujo con tirada de ataque. Al impactar puedes empujar al objetivo 10 pies.",
    pred: (t) => t.attack,
  },
];

export function eleccionesTrucoInvocacion(
  invocaciones: string[] | string | undefined,
  conocidos: string[] = [],
  trucos: TrucoInvocacion[] = catalogoTrucosBrujo(),
): OriginChoiceDefinition[] {
  const ids = new Set(parsearInvocaciones(rawInvocaciones(invocaciones)));
  const defs: OriginChoiceDefinition[] = [];
  for (const spec of ELECCIONES_TRUCO) {
    if (!ids.has(spec.invId)) continue;
    const options = opcionesTrucoFiltradas(trucos, conocidos, spec.pred);
    if (options.length === 0) continue;
    defs.push({
      id: spec.key,
      scope: "class",
      label: spec.label,
      hint: spec.hint,
      options,
      defaultValue: defaultTruco(options, conocidos),
      editable: "always",
    });
  }
  return defs;
}

function trucoElegido(
  choices: OriginChoices | undefined,
  invId: string,
  key: string,
  pred: (t: TrucoInvocacion) => boolean,
): string | null {
  if (!parsearInvocaciones(choices?.class?.[INVOCATIONS_KEY]).includes(invId)) return null;
  const options = opcionesTrucoFiltradas(catalogoTrucosBrujo(), [], pred);
  const id = choices?.class?.[key];
  if (id && options.some((o) => o.value === id)) return id;
  return defaultTruco(options, []) || null;
}

export function trucoAgonizanteElegido(choices: OriginChoices | undefined): string | null {
  return trucoElegido(choices, AGONIZING_BLAST_ID, AGONIZING_BLAST_CANTRIP_KEY, (t) => t.damage);
}

/** Modificador de Carisma a sumar al daño del truco de Descarga agonizante (0 si no aplica). */
export function extraDañoAgonizante(
  character: Character,
  spellId: string | null | undefined,
): number {
  if (!spellId) return 0;
  if (trucoAgonizanteElegido(character.originChoices) !== spellId) return 0;
  return modificadorAtributo(character.abilities.cha);
}

/** Dados de daño de catálogo más el bonus de Descarga agonizante, p. ej. `1d10+3`. */
export function textoDañoConjuroConInvocaciones(
  character: Character,
  spellId: string,
  dice: string,
): string {
  const extra = extraDañoAgonizante(character, spellId);
  if (extra === 0) return dice;
  const signo = extra > 0 ? `+${extra}` : `${extra}`;
  return `${dice}${signo}`;
}

export function trucoLanzaElegido(choices: OriginChoices | undefined): string | null {
  return trucoElegido(choices, ELDRITCH_SPEAR_ID, ELDRITCH_SPEAR_CANTRIP_KEY, (t) => t.attack);
}

export function trucoRepelenteElegido(choices: OriginChoices | undefined): string | null {
  return trucoElegido(choices, REPELLING_BLAST_ID, REPELLING_BLAST_CANTRIP_KEY, (t) => t.attack);
}
