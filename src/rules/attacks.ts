import type { AbilityKey } from "@/lib/constants";
import { traducirAlcanceConjuro } from "@/lib/rules-text-polish";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { obtenerArma, t, type SrdWeapon } from "@/rules/srd";
import { esCompetenteConArma } from "@/rules/proficiencies";
import type { Character, CombatAttack, EquipmentItem } from "@/schemas/character";

const MOD_SHORT: Record<AbilityKey, string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

export function modificadorAtaque(character: Character, attack: CombatAttack): number {
  const base = modificadorAtributo(character.abilities[attack.abilityKey]);
  const pb = attack.proficient ? bonificadorCompetencia(character.identity.level) : 0;
  const magic = attack.magicBonus ?? 0;
  return base + pb + magic;
}

export function crearAtaqueVacio(partial?: Partial<CombatAttack>): CombatAttack {
  return {
    id: crypto.randomUUID(),
    name: "",
    abilityKey: "str",
    proficient: true,
    damage: "",
    notes: "",
    weaponId: null,
    magicBonus: 0,
    ...partial,
  };
}

function modLabel(key: AbilityKey): string {
  return `MOD ${MOD_SHORT[key]}`;
}

export function formulaDañoArma(
  weapon: SrdWeapon,
  abilityKey: AbilityKey,
  magicBonus = 0,
  twoHanded = false,
): string {
  const die =
    twoHanded && weapon.versatileDamageDie ? weapon.versatileDamageDie : weapon.damageDie;
  const mod = modLabel(abilityKey);
  if (magicBonus > 0) {
    return `${die} + ${mod} + ${magicBonus}`;
  }
  return `${die} + ${mod}`;
}

export function notasArma(weapon: SrdWeapon): string | undefined {
  const parts: string[] = [];
  if (weapon.range) {
    const alcance = traducirAlcanceConjuro(weapon.range) ?? weapon.range;
    parts.push(`Alcance ${alcance}`);
  }
  if (weapon.versatileDamageDie) parts.push(`Versátil ${weapon.versatileDamageDie}`);
  return parts.length ? parts.join(" · ") : undefined;
}

export function nombreAtaqueArma(weapon: SrdWeapon, magicBonus = 0): string {
  const base = t("weapons", weapon.id, weapon.nameEn);
  return magicBonus > 0 ? `${base} +${magicBonus}` : base;
}

export function ataqueDesdeArma(weaponId: string, magicBonus = 0): CombatAttack | null {
  const weapon = obtenerArma(weaponId);
  if (!weapon) return null;

  const abilityKey = weapon.abilityKey;
  return crearAtaqueVacio({
    name: nombreAtaqueArma(weapon, magicBonus),
    abilityKey,
    proficient: true,
    damage: formulaDañoArma(weapon, abilityKey, magicBonus),
    notes: notasArma(weapon),
    weaponId: weapon.id,
    magicBonus,
  });
}

export function esItemAtacable(item: EquipmentItem): boolean {
  return !!(item.weaponId || item.damage?.trim());
}

export function ataqueDesdeItem(
  item: EquipmentItem,
  character?: Character,
): CombatAttack | null {
  if (item.weaponId) {
    const base = ataqueDesdeArma(item.weaponId, item.magicBonus ?? 0);
    if (!base) return null;
    const proficient =
      item.proficient ??
      (character ? esCompetenteConArma(character, item.weaponId) : base.proficient);
    return {
      ...base,
      id: item.id,
      name: item.name || base.name,
      proficient,
    };
  }
  if (item.damage?.trim()) {
    return crearAtaqueVacio({
      id: item.id,
      name: item.name,
      abilityKey: item.abilityKey ?? "str",
      proficient: item.proficient ?? true,
      damage: item.damage,
      magicBonus: item.magicBonus ?? 0,
    });
  }
  return null;
}

export function inventarioItemDesdeArma(weaponId: string, magicBonus = 0): EquipmentItem | null {
  const weapon = obtenerArma(weaponId);
  if (!weapon) return null;
  return {
    id: crypto.randomUUID(),
    name: nombreAtaqueArma(weapon, magicBonus),
    qty: 1,
    weightLb: weapon.weightLb,
    weaponId: weapon.id,
    magicBonus,
  };
}

export const PRESETS_ATAQUE: Pick<
  CombatAttack,
  "name" | "abilityKey" | "proficient" | "damage"
>[] = [
  { name: "Golpe desarmado", abilityKey: "str", proficient: true, damage: "1 + MOD FUE" },
];

export const MAGIC_BONUS_OPTIONS = [0, 1, 2, 3] as const;

export const GOLPE_DESARMADO = crearAtaqueVacio(PRESETS_ATAQUE[0]!);

export const ATAQUE_DESARMADO_ID = "desarmado";

export function armaAtaqueValida(attackId: string, character: Character): boolean {
  if (attackId === ATAQUE_DESARMADO_ID) return true;
  const item = character.equipment.items.find((i) => i.id === attackId);
  return !!item && esItemAtacable(item);
}

export function idAtaqueDefecto(character: Character): string {
  const stored = character.equipment.defaultAttackId;
  if (stored && armaAtaqueValida(stored, character)) return stored;
  return ATAQUE_DESARMADO_ID;
}

export function ataquePorId(character: Character, attackId: string): CombatAttack | null {
  if (attackId === ATAQUE_DESARMADO_ID) return GOLPE_DESARMADO;
  const item = character.equipment.items.find((i) => i.id === attackId);
  if (!item) return null;
  return ataqueDesdeItem(item, character);
}

export function marcarAtaqueDefecto(character: Character, attackId: string | null): Character {
  if (attackId !== null && !armaAtaqueValida(attackId, character)) return character;
  return {
    ...character,
    equipment: { ...character.equipment, defaultAttackId: attackId },
  };
}

export type AtaqueFicha = { id: string; attack: CombatAttack };

/** Ataques en el mismo orden que la ficha PDF (desarmado + inventario, máx. 6). */
export function listarAtaquesFicha(character: Character): AtaqueFicha[] {
  const rows: AtaqueFicha[] = [{ id: ATAQUE_DESARMADO_ID, attack: GOLPE_DESARMADO }];
  for (const item of character.equipment.items.filter(esItemAtacable)) {
    const attack = ataqueDesdeItem(item, character);
    if (attack) rows.push({ id: item.id, attack });
  }
  return rows.slice(0, 6);
}

export function etiquetaAtaqueId(character: Character, attackId: string): string {
  if (attackId === ATAQUE_DESARMADO_ID) return "Golpe desarmado";
  const item = character.equipment.items.find((i) => i.id === attackId);
  if (!item) return attackId;
  const attack = ataqueDesdeItem(item, character);
  return attack?.name ?? item.name;
}
