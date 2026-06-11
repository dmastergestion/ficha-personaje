import { ABILITY_KEYS, SKILL_KEYS, SPELL_SLOT_LEVELS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import {
  ABILITY_LABELS_ES,
  iniciativa,
  modificadorPericia,
  modificadorSalvacion,
  percepcionPasiva,
  velocidad,
} from "@/rules/character";
import { calcularClaseArmadura } from "@/rules/combat";
import type { GameCatalog } from "@/rules/catalog";
import { descripcionClases, clasePrincipal } from "@/rules/multiclass";
import { nombreDote } from "@/rules/feat-text";
import { ataqueDesdeItem, esItemAtacable, modificadorAtaque } from "@/rules/attacks";
import { cdConjuro, modificadorAtaqueConjuro } from "@/rules/spell-cast";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import { metaConjuroParaMostrar } from "@/rules/spell-text";
import {
  clasesParaConjuros,
  espaciosMaximosPersonaje,
  usaPreparadosMulticlase,
} from "@/rules/spells";
import { srdArmor } from "@/rules/srd";
import type { Character } from "@/schemas/character";
import {
  ABILITY_PDF,
  SKILL_PDF,
  attackRowField,
  spellRowField,
  spellSlotCheckbox,
} from "@/pdf/official-field-map";

export interface OfficialPdfValues {
  text: Record<string, string>;
  checks: Record<string, boolean>;
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function joinLines(parts: string[]): string {
  return parts.filter(Boolean).join("\n");
}

const SIZE_ES: Record<string, string> = {
  tiny: "Diminuto",
  sm: "Pequeño",
  med: "Mediano",
  lg: "Grande",
  huge: "Enorme",
  grg: "Gigante",
};

export function buildOfficialPdfValues(
  character: Character,
  catalog: GameCatalog,
  armorClass: number,
): OfficialPdfValues {
  const text: Record<string, string> = {};
  const checks: Record<string, boolean> = {};
  const pb = bonificadorCompetencia(character.identity.level);
  const principal = clasePrincipal(character.identity.classes);

  text["Nombre de Personaje"] = character.identity.name;
  text["Clase"] = descripcionClases(character.identity.classes);
  text["Subclase"] = principal.subclassId
    ? catalog.t("subclasses", principal.subclassId, principal.subclassId)
    : "";
  text["Nivel"] = String(character.identity.level);
  text["Especie"] = character.identity.speciesId
    ? catalog.t("species", character.identity.speciesId, character.identity.speciesId)
    : "";
  text["Trasfondo"] = character.identity.backgroundId
    ? catalog.t("backgrounds", character.identity.backgroundId, character.identity.backgroundId)
    : "";

  const species = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)
    : undefined;
  if (species?.size) text["Tamaño"] = SIZE_ES[species.size] ?? species.size;
  if (species?.traits) text["Atributos de Especie"] = species.traits;

  text["Bonificador por Competencia"] = fmtMod(pb);
  text["Puntos de Golpe Actuales"] = String(character.combat.hpCurrent);
  text["Puntos de Golpe Máximos"] = String(character.combat.hpMax);
  text["Puntos de Golpe Temporales"] = String(character.combat.hpTemp || "");
  text["Clase de Armadura"] = String(armorClass);
  text["Iniciativa"] = fmtMod(iniciativa(character));
  text["Percepción Pasiva"] = String(percepcionPasiva(character));
  text["Velocidad"] = String(velocidad(character, species?.speed ?? 30));
  text["Dados de Golpe Máximos"] = String(character.combat.hitDiceTotal);
  text["Dados de Golpe Gastados"] = String(character.combat.hitDiceUsed);

  checks["Inspiración Heróica"] = character.combat.inspiration;
  checks["Escudo"] = character.equipment.shieldEquipped;

  for (let i = 1; i <= 3; i++) {
    checks[`Salvaciones Contra Muerte - Éxitos ${i}`] =
      character.combat.deathSaves.successes >= i;
    checks[`Salvaciones Contra Muerte - Fallos ${i}`] =
      character.combat.deathSaves.failures >= i;
  }

  const armorProf = new Set(character.proficiencies.armorProficiencies);
  checks["Ligera"] = armorProf.has("light");
  checks["Media"] = armorProf.has("medium");
  checks["Pesada"] = armorProf.has("heavy");
  checks["Escudos"] = armorProf.has("shield");

  text["Armas"] = character.proficiencies.weaponProficiencies.join(", ");
  text["Herramientas"] = character.proficiencies.toolProficiencies.join(", ");
  text["Idiomas"] = character.proficiencies.languages.join(", ");

  for (const key of ABILITY_KEYS) {
    const map = ABILITY_PDF[key];
    const score = character.abilities[key];
    text[map.score] = String(score);
    text[map.mod] = fmtMod(modificadorAtributo(score));
    checks[map.saveBtn] = character.proficiencies.savingThrows.includes(key);
    text[map.saveVal] = fmtMod(modificadorSalvacion(character, key));
  }

  for (const skill of SKILL_KEYS) {
    const map = SKILL_PDF[skill];
    const proficient =
      skill in character.proficiencies.skillOverrides
        ? (character.proficiencies.skillOverrides[skill] ?? false)
        : character.proficiencies.skills.includes(skill);
    checks[map.btn] = proficient;
    text[map.val] = fmtMod(modificadorPericia(character, skill));
  }

  const attacks = character.equipment.items
    .filter(esItemAtacable)
    .map((item) => ataqueDesdeItem(item, character))
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .slice(0, 6);

  attacks.forEach((attack, i) => {
    text[attackRowField(i, "name")] = attack.name;
    text[attackRowField(i, "bonus")] = fmtMod(modificadorAtaque(character, attack));
    text[attackRowField(i, "damage")] = attack.damage ?? "";
    text[attackRowField(i, "notes")] = attack.notes ?? "";
  });

  const spellKey = character.spells.abilityKey;
  if (spellKey) {
    text["Aptitud Mágica"] = ABILITY_LABELS_ES[spellKey];
    text["Modificador por Aptitud Mágica"] = fmtMod(modificadorAtributo(character.abilities[spellKey]));
  }
  const cd = cdConjuro(character);
  const spellAtk = modificadorAtaqueConjuro(character);
  if (cd !== null) text["CD de Salvación de Conjuros"] = String(cd);
  if (spellAtk !== null) text["Bonificador de Ataque de Conjuros"] = fmtMod(spellAtk);

  const maxSlots = espaciosMaximosPersonaje(character);
  const used = character.spells.spellSlotsUsed;
  for (const level of SPELL_SLOT_LEVELS) {
    const lvl = Number(level);
    const max = maxSlots[level];
    if (max > 0) text[`Nivel ${lvl}`] = String(max);
    const spent = used[level] ?? 0;
    for (let i = 1; i <= max && i <= 4; i++) {
      checks[spellSlotCheckbox(lvl, i)] = i <= spent;
    }
  }

  const preparados = usaPreparadosMulticlase(clasesParaConjuros(character));
  const spellIds = [
    ...character.spells.cantripsKnown,
    ...(preparados ? character.spells.spellsPrepared : character.spells.spellsKnown),
  ].slice(0, 30);

  spellIds.forEach((spellId, i) => {
    const spell = catalog.obtenerConjuro(spellId);
    const meta = metaConjuroParaMostrar(spellId, metaTiradaConjuro(spellId, spell));
    const level = spell?.level ?? 0;
    text[spellRowField(i, "name")] = catalog.t("spells", spellId, spell?.nameEn ?? spellId);
    text[spellRowField(i, "level")] = level === 0 ? "0" : String(level);
    if (meta.castingTime) text[spellRowField(i, "time")] = meta.castingTime;
    if (meta.components) text[spellRowField(i, "material")] = meta.components;
    if (meta.range) text[spellRowField(i, "range")] = meta.range;
    if (meta.description) {
      const short =
        meta.description.length > 120 ? `${meta.description.slice(0, 117)}…` : meta.description;
      text[spellRowField(i, "notes")] = short;
    }
    if (meta.ritual) checks[spellRowField(i, "ritual")] = true;
    if (catalog.requiereConcentracion(spellId)) checks[spellRowField(i, "concentration")] = true;
  });

  text["Piezas de Platino"] = String(character.equipment.currency.pp);
  text["Piezas de Oro"] = String(character.equipment.currency.gp);
  text["Piezas de Electrum"] = String(character.equipment.currency.ep);
  text["Piezas de Plata"] = String(character.equipment.currency.sp);
  text["Piezas de Cobre"] = String(character.equipment.currency.cp);

  text["Equipo"] = character.equipment.items
    .map((item) => {
      const qty = item.qty > 1 ? ` ×${item.qty}` : "";
      return `${item.name}${qty}`;
    })
    .join("\n");

  const attuned = character.equipment.items.filter((i) => i.attuned).slice(0, 3);
  attuned.forEach((item, i) => {
    text[`Sintonización con Objetos Mágicos ${i + 1}`] = item.name;
  });

  text["Dotes"] = character.feats.map((f) => nombreDote(f.id) || f.name).join("\n");

  const { roleplay } = character;
  text["Aspecto"] = roleplay.appearance;
  text["Historia y Personalidad"] = joinLines([
    roleplay.personalityTraits && `Rasgos: ${roleplay.personalityTraits}`,
    roleplay.ideals && `Ideales: ${roleplay.ideals}`,
    roleplay.bonds && `Vínculos: ${roleplay.bonds}`,
    roleplay.flaws && `Defectos: ${roleplay.flaws}`,
  ]);

  if (character.notes.trim()) {
    const half = Math.ceil(character.notes.length / 2);
    text["Rasgos de Clase A"] = character.notes.slice(0, half);
    text["Rasgos de Clase B"] = character.notes.slice(half);
  }

  return { text, checks };
}

export function calcularCaParaPdf(character: Character): number {
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  return calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
}
