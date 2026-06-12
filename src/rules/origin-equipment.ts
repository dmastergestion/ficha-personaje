import backgroundMetaJson from "@/data/srd/background-meta.json";
import type { OrigenCatalogo } from "@/rules/origin-benefits";
import {
  extraerSegmentoEquipoTrasfondo,
  parsearSegmentoEquipo,
} from "@/rules/equipment-parsing";
import {
  fusionarEleccionesOrigen,
  type OriginChoices,
} from "@/rules/origin-choices";
import type { Character, EquipmentItem } from "@/schemas/character";

type BackgroundMetaRow = { traits?: string };
const backgroundMeta = backgroundMetaJson as Record<string, BackgroundMetaRow>;

export const ORIGIN_BG_EQUIPMENT_NOTE = "[origen:trasfondo]";
export const BG_EQUIP_GP_KEY = "_bgEquipGp";

export interface PaqueteEquipoTrasfondo {
  items: EquipmentItem[];
  gp: number;
}

function esItemEquipoTrasfondo(item: EquipmentItem): boolean {
  return item.notes === ORIGIN_BG_EQUIPMENT_NOTE;
}

export function parsearPaqueteEquipoTrasfondo(
  traits: string | undefined,
  choice: "A" | "B",
  originChoices: OriginChoices,
): PaqueteEquipoTrasfondo | null {
  const segment = extraerSegmentoEquipoTrasfondo(traits, choice);
  if (!segment) return null;

  if (choice === "B") {
    const gp = Number(segment.match(/(\d+)\s*GP/i)?.[1] ?? 50);
    return { items: [], gp };
  }

  const parsed = parsearSegmentoEquipo(segment, originChoices, ORIGIN_BG_EQUIPMENT_NOTE);
  return { items: parsed.items, gp: parsed.gp };
}

export function aplicarEquipoTrasfondo(
  character: Character,
  catalogo?: OrigenCatalogo,
): Character {
  const backgroundId = character.identity.backgroundId;
  if (!backgroundId) return character;

  const originChoices = fusionarEleccionesOrigen(
    character.identity.speciesId,
    backgroundId,
    character.originChoices,
    catalogo,
  );

  const equipmentChoice = originChoices.background.equipment;
  if (equipmentChoice !== "A" && equipmentChoice !== "B") return character;

  const traits = catalogo?.background?.traits ?? backgroundMeta[backgroundId]?.traits;
  const paquete = parsearPaqueteEquipoTrasfondo(traits, equipmentChoice, originChoices);
  if (!paquete) return character;

  const prevGp = Number(originChoices.background[BG_EQUIP_GP_KEY] ?? 0);
  const itemsSinOrigen = character.equipment.items.filter((item) => !esItemEquipoTrasfondo(item));
  const gp = Math.max(0, character.equipment.currency.gp - prevGp + paquete.gp);

  return {
    ...character,
    originChoices: {
      ...character.originChoices,
      background: {
        ...originChoices.background,
        [BG_EQUIP_GP_KEY]: String(paquete.gp),
      },
    },
    equipment: {
      ...character.equipment,
      currency: {
        ...character.equipment.currency,
        gp,
      },
      items: [...itemsSinOrigen, ...paquete.items],
    },
  };
}

export function personajeNecesitaEquipoTrasfondo(character: Character): boolean {
  const choice = character.originChoices?.background?.equipment;
  if (choice !== "A" && choice !== "B") return false;
  if (!character.identity.backgroundId) return false;
  if (choice === "A") {
    return !character.equipment.items.some(esItemEquipoTrasfondo);
  }
  const gpApplied = Number(character.originChoices?.background?.[BG_EQUIP_GP_KEY] ?? 0);
  return gpApplied === 0;
}

export function resumenEquipoTrasfondo(
  traits: string | undefined,
  choice: "A" | "B",
  originChoices: OriginChoices,
): string[] {
  const paquete = parsearPaqueteEquipoTrasfondo(traits, choice, originChoices);
  if (!paquete) return [];
  const lines = paquete.items.map((item) =>
    item.qty > 1 ? `${item.qty}× ${item.name}` : item.name,
  );
  if (paquete.gp > 0) lines.push(`${paquete.gp} po`);
  return lines;
}
