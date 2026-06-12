import classStartEquipmentJson from "@/data/srd/class-start-equipment.json";
import { parsearSegmentoEquipo } from "@/rules/equipment-parsing";
import { srdArmor, t } from "@/rules/srd";
import type { OriginChoiceDefinition, OriginChoices } from "@/rules/origin-choices";
import type { Character, EquipmentItem } from "@/schemas/character";

type ClassEquipmentRow = Partial<Record<"A" | "B" | "C", string>>;
const classStartEquipment = classStartEquipmentJson as Record<string, ClassEquipmentRow>;

export const ORIGIN_CLASS_EQUIPMENT_NOTE = "[origen:clase]";
export const CLASS_EQUIP_GP_KEY = "_classEquipGp";

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

export function eleccionesClase(classId: string | null): OriginChoiceDefinition[] {
  if (!classId) return [];
  const row = classStartEquipment[classId];
  if (!row) return [];
  const options = opcionesEquipoClase(classId).map((key) => ({
    value: key,
    label: etiquetaOpcionEquipo(row[key]!, key),
  }));
  if (options.length === 0) return [];
  return [
    {
      id: "equipment",
      scope: "class",
      label: "Equipo inicial de clase",
      options,
      defaultValue: "A",
      editable: "never",
    },
  ];
}

export function fusionarEleccionesClase(
  classId: string | null,
  actual: OriginChoices | undefined,
): Pick<OriginChoices, "class"> & OriginChoices {
  const defs = eleccionesClase(classId);
  const classChoices: Record<string, string> = {};
  for (const def of defs) {
    const prev = actual?.class?.[def.id];
    const valid = prev && def.options.some((o) => o.value === prev);
    classChoices[def.id] = valid ? prev : (def.defaultValue ?? def.options[0]?.value ?? "");
  }
  for (const [key, value] of Object.entries(actual?.class ?? {})) {
    if (!(key in classChoices)) classChoices[key] = value;
  }
  return {
    species: actual?.species ?? {},
    background: actual?.background ?? {},
    class: classChoices,
  };
}

export function eleccionClaseCompleta(classId: string | null, choices: OriginChoices): boolean {
  for (const def of eleccionesClase(classId)) {
    if (!choices.class[def.id]) return false;
  }
  return true;
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

  const originChoices = fusionarEleccionesClase(classId, character.originChoices);
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
