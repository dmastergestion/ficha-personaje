import { modificadorAtributo } from "@/rules/ability";
import { bonusCaObjetosMagicos } from "@/rules/inventory";
import type { SrdArmor } from "@/rules/srd";
import { obtenerArmadura, srdArmor } from "@/rules/srd";
import { atributosEfectivos, bestiaFormaActiva } from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";

export type ParteClaseArmadura = {
  id: string;
  label: string;
};

export type DesgloseClaseArmadura = {
  total: number;
  partes: ParteClaseArmadura[];
  resumen: string;
};

export type OpcionesClaseArmadura = {
  etiquetaArmadura?: string;
  extras?: ParteClaseArmadura[];
  classIds?: string[];
  conScore?: number;
  wisScore?: number;
  estiloDefensa?: boolean;
  acBonus?: number;
};

function fmtModCa(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function llevaArmaduraCuerpo(armor: SrdArmor | null | undefined): boolean {
  return !!armor && armor.category !== "shield";
}

/** Desglose legible de la CA (armadura, DES, escudo, manual…). */
export function desgloseClaseArmadura(
  dexScore: number,
  armor: SrdArmor | null | undefined,
  shieldEquipped: boolean,
  shield: SrdArmor | null | undefined,
  override: number | null,
  opts?: OpcionesClaseArmadura,
): DesgloseClaseArmadura {
  const extras = [...(opts?.extras ?? [])];
  const worn = llevaArmaduraCuerpo(armor) ? armor : null;

  if (override !== null) {
    const partes: ParteClaseArmadura[] = [
      { id: "manual", label: `Manual ${override} (ignora escudo y defensa)` },
      ...extras,
    ];
    return { total: override, partes, resumen: partes.map((p) => p.label).join(" + ") };
  }

  const dexMod = modificadorAtributo(dexScore);
  const partes: ParteClaseArmadura[] = [];
  const classIds = opts?.classIds ?? [];
  const esBarbaro = classIds.includes("barbarian");
  const esMonje = classIds.includes("monk");
  const unarmoredBarb = esBarbaro && !worn;
  const unarmoredMonk = esMonje && !worn && !shieldEquipped;

  if (unarmoredBarb) {
    const conMod = modificadorAtributo(opts?.conScore ?? 10);
    partes.push({ id: "base", label: "Arm 10" });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
    if (conMod !== 0) partes.push({ id: "con", label: `CON ${fmtModCa(conMod)}` });
  } else if (unarmoredMonk) {
    const wisMod = modificadorAtributo(opts?.wisScore ?? 10);
    partes.push({ id: "base", label: "Arm 10" });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
    if (wisMod !== 0) partes.push({ id: "wis", label: `SAB ${fmtModCa(wisMod)}` });
  } else if (!worn) {
    partes.push({ id: "base", label: "Arm 10" });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
  } else if (worn.category === "heavy") {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
  } else if (worn.category === "medium") {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    const maxDex = worn.dexMax ?? 2;
    const applied = Math.min(dexMod, maxDex);
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
    if (applied !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(applied)}` });
  } else {
    const nombre = opts?.etiquetaArmadura ?? "Arm";
    partes.push({ id: "armor", label: `${nombre} ${worn.baseAc}` });
    if (dexMod !== 0) partes.push({ id: "dex", label: `DES ${fmtModCa(dexMod)}` });
  }

  if (shieldEquipped && shield && !unarmoredMonk) {
    partes.push({ id: "shield", label: `Esc ${shield.baseAc}` });
  }

  if (opts?.estiloDefensa && worn) {
    extras.push({ id: "defense", label: "Defensa +1" });
  }

  partes.push(...extras);

  const total = calcularClaseArmadura(dexScore, armor, shieldEquipped, shield, override, opts);
  return { total, partes, resumen: partes.map((p) => p.label).join(" + ") };
}

/** Calcula CA según armadura SRD 2024, escudo, defensa sin armadura y override. */
export function calcularClaseArmadura(
  dexScore: number,
  armor: SrdArmor | null | undefined,
  shieldEquipped: boolean,
  shield: SrdArmor | null | undefined,
  override: number | null,
  opts?: OpcionesClaseArmadura,
): number {
  if (override !== null) return override;

  const dexMod = modificadorAtributo(dexScore);
  const worn = llevaArmaduraCuerpo(armor) ? armor : null;
  const classIds = opts?.classIds ?? [];
  const esBarbaro = classIds.includes("barbarian");
  const esMonje = classIds.includes("monk");

  let ac = 10 + dexMod;

  if (esBarbaro && !worn) {
    ac = 10 + dexMod + modificadorAtributo(opts?.conScore ?? 10);
  } else if (esMonje && !worn && !shieldEquipped) {
    ac = 10 + dexMod + modificadorAtributo(opts?.wisScore ?? 10);
  } else if (worn) {
    if (worn.category === "heavy") {
      ac = worn.baseAc;
    } else if (worn.category === "medium") {
      const maxDex = worn.dexMax ?? 2;
      ac = worn.baseAc + Math.min(dexMod, maxDex);
    } else {
      ac = worn.baseAc + dexMod;
    }
  }

  if (shieldEquipped && shield && !(esMonje && !worn)) {
    ac += shield.baseAc;
  }

  if (opts?.estiloDefensa && worn) {
    ac += 1;
  }

  if (opts?.acBonus) {
    ac += opts.acBonus;
  }

  return ac;
}

export function opcionesCaPersonaje(character: Character): OpcionesClaseArmadura {
  const magico = bonusCaObjetosMagicos(character);
  return {
    classIds: character.identity.classes.map((c) => c.classId),
    conScore: character.abilities.con,
    wisScore: character.abilities.wis,
    estiloDefensa: character.feats.some((f) => f.id === "defense"),
    extras: magico > 0 ? [{ id: "magic-items", label: `Objetos +${magico}` }] : undefined,
    acBonus: magico,
  };
}

export function claseArmaduraPersonaje(character: Character): number {
  const beastAc = bestiaFormaActiva(character)?.combat?.ac;
  const magico = bonusCaObjetosMagicos(character);
  if (character.combat.armorClassOverride !== null) {
    return character.combat.armorClassOverride;
  }
  if (beastAc != null) {
    return beastAc + magico;
  }
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = obtenerArmadura(character.equipment.armorId) ?? null;
  return calcularClaseArmadura(
    atributosEfectivos(character).dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    null,
    opcionesCaPersonaje(character),
  );
}

export function penalizacionVelocidadArmaduraPesada(character: Character): number {
  if (bestiaFormaActiva(character)?.combat) return 0;
  const armor = obtenerArmadura(character.equipment.armorId);
  if (!armor || armor.category !== "heavy" || armor.strengthMin == null) return 0;
  return atributosEfectivos(character).str < armor.strengthMin ? 10 : 0;
}

export function desgloseCaPersonaje(
  character: Character,
  opts?: { etiquetaArmadura?: string },
): DesgloseClaseArmadura {
  const bestia = bestiaFormaActiva(character);
  const magico = bonusCaObjetosMagicos(character);
  if (bestia?.combat && character.combat.armorClassOverride === null) {
    const partes: ParteClaseArmadura[] = [
      { id: "wild-shape", label: `${bestia.nameEs} ${bestia.combat.ac}` },
    ];
    if (magico > 0) partes.push({ id: "magic-items", label: `Objetos +${magico}` });
    return {
      total: bestia.combat.ac + magico,
      partes,
      resumen: partes.map((p) => p.label).join(" + "),
    };
  }
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = obtenerArmadura(character.equipment.armorId) ?? null;
  return desgloseClaseArmadura(
    atributosEfectivos(character).dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
    {
      ...opcionesCaPersonaje(character),
      etiquetaArmadura: opts?.etiquetaArmadura,
    },
  );
}
