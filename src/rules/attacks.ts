import type { AbilityKey } from "@/lib/constants";
import { traducirAlcanceConjuro } from "@/lib/rules-text-polish";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import {
  armaPactoElegida,
  PACT_WEAPON_ATTACK_ID,
  trucoAgonizanteElegido,
} from "@/rules/invocations";

export { PACT_WEAPON_ATTACK_ID };
import { obtenerArma, t, type SrdWeapon } from "@/rules/srd";
import { esCompetenteConArma } from "@/rules/proficiencies";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import type { Character, CombatAttack, EquipmentItem } from "@/schemas/character";

const MOD_SHORT: Record<AbilityKey, string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

function nivelClase(character: Character, classId: string): number {
  return (
    character.identity.classes.find((c) => c.classId === classId)?.level ??
    (character.identity.classId === classId ? character.identity.level : 0)
  );
}

function propsArma(weapon: SrdWeapon): Set<string> {
  return new Set(weapon.properties.map((p) => p.toLowerCase()));
}

function armaEsDistancia(weapon: SrdWeapon): boolean {
  return /r$/i.test(weapon.category) || weapon.category.toLowerCase().includes("ranged");
}

function armaEsCuerpoACuerpo(weapon: SrdWeapon): boolean {
  return !armaEsDistancia(weapon);
}

function armaADosManos(weapon: SrdWeapon): boolean {
  return propsArma(weapon).has("two");
}

function armaSutil(weapon: SrdWeapon): boolean {
  const props = propsArma(weapon);
  return props.has("fin") || props.has("finesse");
}

/** Dado de artes marciales PHB 2024. */
export function dadoArtesMarciales(nivelMonje: number): string {
  if (nivelMonje >= 17) return "1d12";
  if (nivelMonje >= 11) return "1d10";
  if (nivelMonje >= 5) return "1d8";
  if (nivelMonje >= 1) return "1d6";
  return "1";
}

export function bonusRabia(nivelBarbaro: number): number {
  if (nivelBarbaro >= 16) return 4;
  if (nivelBarbaro >= 9) return 3;
  if (nivelBarbaro >= 1) return 2;
  return 0;
}

export function atributoAtaqueArma(
  character: Character,
  weapon: SrdWeapon,
  override?: AbilityKey,
): AbilityKey {
  if (override) return override;
  if (armaSutil(weapon)) {
    return character.abilities.str >= character.abilities.dex ? "str" : "dex";
  }
  return weapon.abilityKey;
}

function armasMeleeEmpunadas(character: Character, attack: CombatAttack): string[] {
  const ids = new Set<string>();
  const add = (weaponId: string | null | undefined) => {
    if (!weaponId) return;
    const weapon = obtenerArma(weaponId);
    if (weapon && armaEsCuerpoACuerpo(weapon)) ids.add(weaponId);
  };
  add(attack.weaponId);
  for (const item of character.equipment.items) {
    if (!itemEnCombate(item)) continue;
    add(item.weaponId);
  }
  return [...ids];
}

export type ExtrasAtaque = {
  toHit: number;
  toHitLabel: string | null;
  damage: number;
  damageLabel: string | null;
  ventaja: boolean;
};

export function extrasAtaque(character: Character, attack: CombatAttack): ExtrasAtaque {
  const extras: ExtrasAtaque = {
    toHit: 0,
    toHitLabel: null,
    damage: 0,
    damageLabel: null,
    ventaja: false,
  };
  const weapon = attack.weaponId ? obtenerArma(attack.weaponId) : undefined;
  const feats = new Set(character.feats.map((f) => f.id));
  const esDesarmado = !attack.weaponId;

  if (feats.has("archery") && weapon && armaEsDistancia(weapon)) {
    extras.toHit += 2;
    extras.toHitLabel = "Tiro con arco +2";
  }

  const duelo =
    feats.has("dueling") &&
    weapon &&
    armaEsCuerpoACuerpo(weapon) &&
    !armaADosManos(weapon) &&
    armasMeleeEmpunadas(character, attack).length <= 1;
  if (duelo) {
    extras.damage += 2;
    extras.damageLabel = "Duelo +2";
  }

  const nivelBarbaro = nivelClase(character, "barbarian");
  const rabia =
    character.combat.raging &&
    nivelBarbaro > 0 &&
    attack.abilityKey === "str" &&
    (esDesarmado || (weapon && armaEsCuerpoACuerpo(weapon)));
  if (rabia) {
    const bonus = bonusRabia(nivelBarbaro);
    extras.damage += bonus;
    extras.damageLabel = extras.damageLabel
      ? `${extras.damageLabel} · Rabia +${bonus}`
      : `Rabia +${bonus}`;
  }

  const temerario =
    character.combat.reckless &&
    nivelBarbaro > 0 &&
    attack.abilityKey === "str" &&
    (esDesarmado || (weapon && armaEsCuerpoACuerpo(weapon)));
  if (temerario) {
    extras.ventaja = true;
  }

  return extras;
}

export function modificadorAtaque(character: Character, attack: CombatAttack): number {
  const base = modificadorAtributo(character.abilities[attack.abilityKey]);
  const pb = attack.proficient ? bonificadorCompetencia(character.identity.level) : 0;
  const magic = attack.magicBonus ?? 0;
  return base + pb + magic + extrasAtaque(character, attack).toHit;
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

export function ataqueDesdeArma(
  weaponId: string,
  magicBonus = 0,
  character?: Character,
  abilityOverride?: AbilityKey,
): CombatAttack | null {
  const weapon = obtenerArma(weaponId);
  if (!weapon) return null;

  const abilityKey = character
    ? atributoAtaqueArma(character, weapon, abilityOverride)
    : (abilityOverride ?? weapon.abilityKey);
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

function notaPacto(notes: string | undefined): string {
  const extra = "Arma de pacto · CAR";
  if (!notes) return extra;
  if (notes.includes("Arma de pacto")) return notes;
  return `${notes} · ${extra}`;
}

function aplicarArmaPacto(attack: CombatAttack, character: Character): CombatAttack {
  const pactWeaponId = armaPactoElegida(character.originChoices);
  if (!pactWeaponId || attack.weaponId !== pactWeaponId) return attack;
  const weapon = obtenerArma(pactWeaponId);
  if (!weapon) return attack;
  return {
    ...attack,
    abilityKey: "cha",
    proficient: true,
    damage: formulaDañoArma(weapon, "cha", attack.magicBonus ?? 0),
    notes: notaPacto(attack.notes),
  };
}

export function itemInventarioEsArmaPacto(item: EquipmentItem, character: Character): boolean {
  const pactWeaponId = armaPactoElegida(character.originChoices);
  return !!pactWeaponId && item.weaponId === pactWeaponId;
}

export function ataqueArmaPactoConvocada(character: Character): CombatAttack | null {
  const weaponId = armaPactoElegida(character.originChoices);
  if (!weaponId) return null;
  if (character.equipment.items.some((item) => itemInventarioEsArmaPacto(item, character))) {
    return null;
  }
  const base = ataqueDesdeArma(weaponId);
  if (!base) return null;
  const weapon = obtenerArma(weaponId) as SrdWeapon;
  return aplicarArmaPacto(
    {
      ...base,
      id: PACT_WEAPON_ATTACK_ID,
      name: `${nombreAtaqueArma(weapon)} (pacto)`,
    },
    character,
  );
}

export function esItemAtacable(item: EquipmentItem): boolean {
  return !!(item.weaponId || item.damage?.trim());
}

/** Arma/objeto listo para la tabla de combate (multi). Ausente = sí. */
export function itemEnCombate(item: EquipmentItem): boolean {
  return esItemAtacable(item) && item.inCombat !== false;
}

export function ataqueDesdeItem(
  item: EquipmentItem,
  character?: Character,
): CombatAttack | null {
  let attack: CombatAttack | null = null;
  if (item.weaponId) {
    const base = ataqueDesdeArma(item.weaponId, item.magicBonus ?? 0, character, item.abilityKey);
    if (!base) return null;
    const proficient =
      item.proficient ??
      (character ? esCompetenteConArma(character, item.weaponId) : base.proficient);
    attack = {
      ...base,
      id: item.id,
      name: item.name || base.name,
      proficient,
    };
  } else if (item.damage?.trim()) {
    attack = crearAtaqueVacio({
      id: item.id,
      name: item.name,
      abilityKey: item.abilityKey ?? "str",
      proficient: item.proficient ?? true,
      damage: item.damage,
      magicBonus: item.magicBonus ?? 0,
    });
  }
  if (!attack || !character) return attack;
  return aplicarArmaPacto(attack, character);
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
    inCombat: true,
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

export function golpeDesarmadoPersonaje(character: Character): CombatAttack {
  const nivelMonje = nivelClase(character, "monk");
  if (nivelMonje >= 1) {
    const abilityKey: AbilityKey =
      character.abilities.dex >= character.abilities.str ? "dex" : "str";
    const die = dadoArtesMarciales(nivelMonje);
    return crearAtaqueVacio({
      id: ATAQUE_DESARMADO_ID,
      name: "Golpe desarmado",
      abilityKey,
      proficient: true,
      damage: `${die} + ${modLabel(abilityKey)}`,
      notes: "Artes marciales",
    });
  }
  return { ...GOLPE_DESARMADO, id: ATAQUE_DESARMADO_ID };
}

export function armaAtaqueValida(attackId: string, character: Character): boolean {
  if (attackId === ATAQUE_DESARMADO_ID) return true;
  if (attackId === PACT_WEAPON_ATTACK_ID) return !!ataqueArmaPactoConvocada(character);
  const item = character.equipment.items.find((i) => i.id === attackId);
  return !!item && itemEnCombate(item);
}

export function idAtaqueDefecto(character: Character): string {
  const stored = character.equipment.defaultAttackId;
  if (stored && armaAtaqueValida(stored, character)) return stored;
  return ATAQUE_DESARMADO_ID;
}

export function ataquePorId(character: Character, attackId: string): CombatAttack | null {
  if (attackId === ATAQUE_DESARMADO_ID) return golpeDesarmadoPersonaje(character);
  if (attackId === PACT_WEAPON_ATTACK_ID) return ataqueArmaPactoConvocada(character);
  const item = character.equipment.items.find((i) => i.id === attackId);
  if (!item) return null;
  return ataqueDesdeItem(item, character);
}

export function marcarAtaqueDefecto(character: Character, attackId: string | null): Character {
  if (attackId !== null && !armaAtaqueValida(attackId, character)) return character;
  let items = character.equipment.items;
  if (attackId && attackId !== ATAQUE_DESARMADO_ID && attackId !== PACT_WEAPON_ATTACK_ID) {
    items = items.map((item) =>
      item.id === attackId ? { ...item, inCombat: true } : item,
    );
  }
  return {
    ...character,
    equipment: { ...character.equipment, items, defaultAttackId: attackId },
  };
}

/** Activa o desactiva un arma en combate (varias a la vez). */
export function alternarEnCombate(character: Character, itemId: string): Character {
  const target = character.equipment.items.find((i) => i.id === itemId);
  if (!target || !esItemAtacable(target)) return character;
  const nextInCombat = !itemEnCombate(target);
  const items = character.equipment.items.map((item) =>
    item.id === itemId ? { ...item, inCombat: nextInCombat } : item,
  );
  let defaultAttackId = character.equipment.defaultAttackId;
  if (nextInCombat && (!defaultAttackId || defaultAttackId === ATAQUE_DESARMADO_ID)) {
    defaultAttackId = itemId;
  } else if (!nextInCombat && defaultAttackId === itemId) {
    const otraEnCombate = items.find(
      (i) => i.id !== itemId && esItemAtacable(i) && i.inCombat !== false,
    );
    defaultAttackId = otraEnCombate?.id ?? null;
  }
  return {
    ...character,
    equipment: { ...character.equipment, items, defaultAttackId },
  };
}

export type AtaqueFicha = { id: string; attack: CombatAttack };

/** Ataques en el mismo orden que la ficha PDF (desarmado + inventario en combate, máx. 6). */
export function listarAtaquesFicha(character: Character): AtaqueFicha[] {
  const rows: AtaqueFicha[] = [
    { id: ATAQUE_DESARMADO_ID, attack: golpeDesarmadoPersonaje(character) },
  ];
  const pacto = ataqueArmaPactoConvocada(character);
  if (pacto) rows.push({ id: PACT_WEAPON_ATTACK_ID, attack: pacto });
  for (const item of character.equipment.items.filter(itemEnCombate)) {
    const attack = ataqueDesdeItem(item, character);
    if (attack) rows.push({ id: item.id, attack });
  }
  return rows.slice(0, 6);
}

export function etiquetaAtaqueId(character: Character, attackId: string): string {
  if (attackId === ATAQUE_DESARMADO_ID) return "Golpe desarmado";
  if (attackId === PACT_WEAPON_ATTACK_ID) {
    return ataqueArmaPactoConvocada(character)?.name ?? "Arma de pacto";
  }
  const item = character.equipment.items.find((i) => i.id === attackId);
  if (!item) return attackId;
  const attack = ataqueDesdeItem(item, character);
  return attack?.name ?? item.name;
}

/** Truco de ataque para el atajo de mesa (Descarga agonizante o el primer truco de ataque). */
export function trucoAtaqueRapido(character: Character): string | null {
  const known = new Set(character.spells.cantripsKnown);
  const agonizante = trucoAgonizanteElegido(character.originChoices);
  if (agonizante && known.has(agonizante)) return agonizante;
  if (known.has("eldritch-blast")) return "eldritch-blast";
  for (const id of character.spells.cantripsKnown) {
    if (metaTiradaConjuro(id).tipo === "attack") return id;
  }
  return null;
}

export type AccionBarraCombate = {
  tipo: "arma" | "truco";
  id: string;
  etiqueta: string;
};

/** Arma predeterminada, o truco de ataque si el predeterminado es el golpe desarmado. */
export function accionBarraCombate(character: Character): AccionBarraCombate {
  const attackId = idAtaqueDefecto(character);
  if (attackId !== ATAQUE_DESARMADO_ID) {
    return { tipo: "arma", id: attackId, etiqueta: etiquetaAtaqueId(character, attackId) };
  }
  const truco = trucoAtaqueRapido(character);
  if (truco) {
    return { tipo: "truco", id: truco, etiqueta: t("spells", truco, truco) };
  }
  return {
    tipo: "arma",
    id: ATAQUE_DESARMADO_ID,
    etiqueta: etiquetaAtaqueId(character, ATAQUE_DESARMADO_ID),
  };
}
