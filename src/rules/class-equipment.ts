import classStartEquipmentJson from "@/data/srd/class-start-equipment.json";
import { parsearSegmentoEquipo } from "@/rules/equipment-parsing";
import {
  eleccionArmaPacto,
  eleccionesInvocaciones,
  eleccionesTrucoInvocacion,
  fusionarInvocaciones,
  invocacionesCompletas,
  INVOCATIONS_KEY,
  KEYS_SEGUIMIENTO_INVOCACION,
  nivelBrujoClases,
  parsearInvocaciones,
} from "@/rules/invocations";
import { eleccionesManiobras } from "@/rules/battle-master";
import {
  WILD_HEART_RAGE_KEY,
  WILD_HEART_RAGE_OPTIONS,
} from "@/rules/wild-heart";
import { competenciasClase } from "@/rules/proficiencies";
import { srdArmor, t } from "@/rules/srd";
import type { OriginChoiceDefinition, OriginChoices } from "@/rules/origin-choices";
import type { Character, ClassLevel, EquipmentItem } from "@/schemas/character";

type ClassEquipmentRow = Partial<Record<"A" | "B" | "C", string>>;
const classStartEquipment = classStartEquipmentJson as Record<string, ClassEquipmentRow>;

export const ORIGIN_CLASS_EQUIPMENT_NOTE = "[origen:clase]";
export const CLASS_EQUIP_GP_KEY = "_classEquipGp";
export const DIVINE_ORDER_KEY = "divine-order";
export const LAND_TERRAIN_KEY = "land-terrain";
export type OrdenDivino = "protector" | "thaumaturge";

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export type ClassEquipmentChoice = "A" | "B" | "C";

function esItemEquipoClase(item: EquipmentItem): boolean {
  return item.notes === ORIGIN_CLASS_EQUIPMENT_NOTE;
}

export function opcionesEquipoClase(classId: string): ClassEquipmentChoice[] {
  const row = classStartEquipment[classId];
  if (!row) return [];
  return (["A", "B", "C"] as const).filter((key) => !!row[key]);
}

function etiquetaOpcionEquipo(segment: string, letter: ClassEquipmentChoice): string {
  const gp = segment.match(/^(\d+)\s*GP$/i)?.[1];
  if (gp) return `Equipo ${letter} (${gp} po)`;
  return `Equipo ${letter} (paquete de clase)`;
}

export type OpcionesEleccionClase = {
  classes?: ClassLevel[];
  classLevel?: number;
  subclassId?: string | null;
  invocaciones?: string;
  trucosConocidos?: string[];
};

function nivelParaEleccion(classId: string, opts?: OpcionesEleccionClase): number {
  if (opts?.classLevel != null) return opts.classLevel;
  if (opts?.classes) {
    const fromClasses = opts.classes.find((c) => c.classId === classId)?.level;
    if (fromClasses != null) return fromClasses;
    return nivelBrujoClases(opts.classes);
  }
  return 1;
}

function subclassDeClase(classId: string, opts?: OpcionesEleccionClase): string | null {
  return opts?.classes?.find((c) => c.classId === classId)?.subclassId ?? opts?.subclassId ?? null;
}

const LAND_TERRAIN_OPTIONS: { value: string; label: string }[] = [
  { value: "arid", label: "Tierra árida" },
  { value: "polar", label: "Tierra polar" },
  { value: "temperate", label: "Tierra templada" },
  { value: "tropical", label: "Tierra tropical" },
];

export function eleccionesClase(
  classId: string | null,
  opts?: OpcionesEleccionClase,
): OriginChoiceDefinition[] {
  if (!classId) return [];
  const defs: OriginChoiceDefinition[] = [];
  const row = classStartEquipment[classId];
  if (row) {
    const options = opcionesEquipoClase(classId).map((key) => ({
      value: key,
      label: etiquetaOpcionEquipo(row[key]!, key),
    }));
    if (options.length > 0) {
      defs.push({
        id: "equipment",
        scope: "class",
        label: "Equipo inicial de clase",
        options,
        defaultValue: "A",
        editable: "never",
      });
    }
  }
  if (classId === "cleric") {
    defs.push({
      id: DIVINE_ORDER_KEY,
      scope: "class",
      label: "Orden divino",
      hint: "Protector: armadura pesada y armas marciales. Taumaturgo: un truco extra de clérigo y bonus a Arcana y Religión.",
      options: [
        { value: "protector", label: "Protector (armadura pesada y armas marciales)" },
        { value: "thaumaturge", label: "Taumaturgo (truco extra y bonus a Arcana/Religión)" },
      ],
      editable: "never",
    });
  }
  if (classId === "druid" && subclassDeClase(classId, opts) === "land") {
    defs.push({
      id: LAND_TERRAIN_KEY,
      scope: "class",
      label: "Terreno del círculo",
      hint: "Determina los conjuros siempre preparados del Círculo de la Tierra.",
      options: LAND_TERRAIN_OPTIONS,
      defaultValue: "temperate",
      editable: "always",
    });
  }
  if (classId === "barbarian" && subclassDeClase(classId, opts) === "wild-heart") {
    defs.push({
      id: WILD_HEART_RAGE_KEY,
      scope: "class",
      label: "Rabia de las tierras salvajes",
      hint: "La eliges al activar la Rabia. Oso aplica resistencia extra mientras rages.",
      options: WILD_HEART_RAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      defaultValue: "bear",
      editable: "always",
    });
  }
  defs.push(
    ...eleccionesManiobras(classId, nivelParaEleccion(classId, opts), subclassDeClase(classId, opts)),
  );
  defs.push(...eleccionesInvocaciones(classId, nivelParaEleccion(classId, opts)));
  defs.push(...eleccionArmaPacto(opts?.invocaciones));
  defs.push(...eleccionesTrucoInvocacion(opts?.invocaciones, opts?.trucosConocidos));
  return defs;
}

export function ordenDivinoElegido(choices?: OriginChoices | null): OrdenDivino | null {
  const raw = choices?.class?.[DIVINE_ORDER_KEY];
  if (raw === "protector" || raw === "thaumaturge") return raw;
  return null;
}

export function extraTrucosOrdenDivino(
  classId: string | null | undefined,
  choices?: OriginChoices | null,
): number {
  if (classId !== "cleric") return 0;
  return ordenDivinoElegido(choices) === "thaumaturge" ? 1 : 0;
}

export function aplicarCompetenciasOrdenDivino(
  classId: string,
  choices: OriginChoices | undefined,
  armorProficiencies: string[],
  weaponProficiencies: string[],
): { armorProficiencies: string[]; weaponProficiencies: string[] } {
  if (classId !== "cleric" || ordenDivinoElegido(choices) !== "protector") {
    return { armorProficiencies, weaponProficiencies };
  }
  return {
    armorProficiencies: uniq([...armorProficiencies, "heavy"]),
    weaponProficiencies: uniq([...weaponProficiencies, "martial"]),
  };
}

/** Recalcula armadura/armas de clase + Orden divino; conserva herramientas que no sean de clase. */
export function sincronizarCompetenciasOrdenDivino(character: Character): Character {
  const classIds = character.identity.classes.map((c) => c.classId);
  const armor: string[] = [];
  const weapons: string[] = [];
  const classTools: string[] = [];
  for (const id of classIds) {
    const row = competenciasClase(id);
    armor.push(...row.armorProficiencies);
    weapons.push(...row.weaponProficiencies);
    classTools.push(...row.toolProficiencies);
  }
  const withOrder = aplicarCompetenciasOrdenDivino(
    character.identity.classId,
    character.originChoices,
    armor,
    weapons,
  );
  const classToolSet = new Set(classTools);
  const extraTools = character.proficiencies.toolProficiencies.filter((t) => !classToolSet.has(t));
  return {
    ...character,
    proficiencies: {
      ...character.proficiencies,
      armorProficiencies: uniq(withOrder.armorProficiencies),
      weaponProficiencies: uniq(withOrder.weaponProficiencies),
      toolProficiencies: uniq([...classTools, ...extraTools]),
    },
  };
}

function idsClaseParaElecciones(classId: string | null, opts?: OpcionesEleccionClase): string[] {
  return [...new Set([...(opts?.classes?.map((c) => c.classId) ?? []), ...(classId ? [classId] : [])])];
}

export function fusionarEleccionesClase(
  classId: string | null,
  actual: OriginChoices | undefined,
  opts?: OpcionesEleccionClase,
): Pick<OriginChoices, "class"> & OriginChoices {
  const classIds = idsClaseParaElecciones(classId, opts);
  const warlockLevel = classIds.includes("warlock") ? nivelParaEleccion("warlock", opts) : 1;
  const invocaciones = classIds.includes("warlock")
    ? fusionarInvocaciones(warlockLevel, actual?.class?.[INVOCATIONS_KEY])
    : (opts?.invocaciones ?? actual?.class?.[INVOCATIONS_KEY]);
  const defs = classIds.flatMap((id) => eleccionesClase(id, { ...opts, invocaciones }));
  const classChoices: Record<string, string> = {};
  for (const def of defs) {
    const prev = actual?.class?.[def.id];
    if (def.kind === "multi") {
      classChoices[def.id] =
        def.id === INVOCATIONS_KEY
          ? fusionarInvocaciones(warlockLevel, prev)
          : (prev ?? "");
      continue;
    }
    const valid = prev && def.options.some((o) => o.value === prev && o.value !== "");
    classChoices[def.id] = valid ? prev : (def.defaultValue ?? "");
  }
  for (const [key, value] of Object.entries(actual?.class ?? {})) {
    if (key in classChoices) continue;
    if (KEYS_SEGUIMIENTO_INVOCACION.has(key)) continue;
    classChoices[key] = value;
  }
  return {
    species: actual?.species ?? {},
    background: actual?.background ?? {},
    class: classChoices,
  };
}

export function faltaEleccionClase(
  classId: string | null,
  choices: OriginChoices,
  opts?: OpcionesEleccionClase,
): string | null {
  const classLevel = classId ? nivelParaEleccion(classId, opts) : 1;
  const invocaciones = choices.class[INVOCATIONS_KEY] ?? opts?.invocaciones;
  for (const def of eleccionesClase(classId, { ...opts, invocaciones })) {
    if (def.kind === "multi") {
      if (def.id === INVOCATIONS_KEY) {
        if (!invocacionesCompletas(classLevel, choices.class[def.id])) {
          return "Elige las invocaciones místicas.";
        }
        continue;
      }
      const n = parsearInvocaciones(choices.class[def.id]).length;
      const max = def.maxSelections ?? 0;
      if (max > 0 && n < max) {
        return `Elige ${max} en ${def.label} (${n}/${max}).`;
      }
      continue;
    }
    if (!choices.class[def.id]) {
      return def.id === "equipment" ? "Elige el equipo inicial de clase." : `Elige: ${def.label}.`;
    }
  }
  return null;
}

export function eleccionClaseCompleta(
  classId: string | null,
  choices: OriginChoices,
  opts?: OpcionesEleccionClase,
): boolean {
  return faltaEleccionClase(classId, choices, opts) == null;
}

export function segmentoEquipoClase(
  classId: string,
  choice: ClassEquipmentChoice,
): string | null {
  return classStartEquipment[classId]?.[choice] ?? null;
}

export function parsearPaqueteEquipoClase(
  classId: string,
  choice: ClassEquipmentChoice,
  originChoices: OriginChoices,
): { items: EquipmentItem[]; gp: number; armorId: string | null; shieldEquipped: boolean } | null {
  const segment = segmentoEquipoClase(classId, choice);
  if (!segment) return null;
  return parsearSegmentoEquipo(segment, originChoices, ORIGIN_CLASS_EQUIPMENT_NOTE);
}

export function resumenEquipoClase(
  classId: string,
  choice: ClassEquipmentChoice,
  originChoices: OriginChoices,
): string[] {
  const paquete = parsearPaqueteEquipoClase(classId, choice, originChoices);
  if (!paquete) return [];
  const lines = paquete.items.map((item) =>
    item.qty > 1 ? `${item.qty}× ${item.name}` : item.name,
  );
  if (paquete.armorId) {
    const armor = srdArmor.find((a) => a.id === paquete.armorId);
    lines.unshift(armor ? t("armor", armor.id, armor.nameEn) : paquete.armorId);
  }
  if (paquete.shieldEquipped) lines.unshift("Escudo");
  if (paquete.gp > 0) lines.push(`${paquete.gp} po`);
  return lines;
}

export function aplicarEquipoClase(character: Character): Character {
  const classId = character.identity.classId;
  if (!classId) return character;

  const originChoices = fusionarEleccionesClase(classId, character.originChoices, {
    classLevel: character.identity.classes.find((c) => c.classId === classId)?.level
      ?? character.identity.level,
  });
  const equipmentChoice = originChoices.class.equipment as ClassEquipmentChoice | undefined;
  if (!equipmentChoice || !opcionesEquipoClase(classId).includes(equipmentChoice)) {
    return character;
  }

  const paquete = parsearPaqueteEquipoClase(classId, equipmentChoice, originChoices);
  if (!paquete) return character;

  const prevGp = Number(originChoices.class[CLASS_EQUIP_GP_KEY] ?? 0);
  const itemsSinClase = character.equipment.items.filter((item) => !esItemEquipoClase(item));
  const gp = Math.max(0, character.equipment.currency.gp - prevGp + paquete.gp);

  const firstWeapon = paquete.items.find((item) => item.weaponId);
  const hadClassDefault =
    character.equipment.defaultAttackId &&
    character.equipment.items.some(
      (item) =>
        esItemEquipoClase(item) && item.id === character.equipment.defaultAttackId,
    );

  return {
    ...character,
    originChoices: {
      ...character.originChoices,
      class: {
        ...originChoices.class,
        [CLASS_EQUIP_GP_KEY]: String(paquete.gp),
      },
    },
    equipment: {
      ...character.equipment,
      armorId: paquete.armorId ?? character.equipment.armorId,
      shieldEquipped: paquete.shieldEquipped || character.equipment.shieldEquipped,
      defaultAttackId:
        firstWeapon?.id ?? (hadClassDefault ? null : character.equipment.defaultAttackId),
      currency: {
        ...character.equipment.currency,
        gp,
      },
      items: [...itemsSinClase, ...paquete.items],
    },
  };
}
