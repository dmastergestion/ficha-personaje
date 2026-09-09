import { ABILITY_KEYS, SKILL_KEYS, SPELL_SLOT_LEVELS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import {
  ABILITY_LABELS_ES,
  esProficientePericia,
  iniciativa,
  modificadorPericia,
  modificadorSalvacion,
  percepcionPasiva,
  velocidad,
} from "@/rules/character";
import { claseArmaduraPersonaje } from "@/rules/combat";
import type { GameCatalog } from "@/rules/catalog";
import { descripcionClases, clasePrincipal } from "@/rules/multiclass";
import { nombreDote } from "@/rules/feat-text";
import { ATAQUE_DESARMADO_ID, listarAtaquesFicha, modificadorAtaque } from "@/rules/attacks";
import { cdConjuro, modificadorAtaqueConjuro, textoDañoMostradoConjuro } from "@/rules/spell-cast";
import { ETIQUETA_ORIGEN_CONJURO, filasConjurosFicha } from "@/rules/spell-grants";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import { metaConjuroParaMostrar } from "@/rules/spell-text";
import { descripcionOrigenEs } from "@/rules/origin-description";
import {
  etiquetaListaCompetenciasArmas,
  etiquetaListaCompetenciasHerramientas,
} from "@/rules/proficiencies";
import {
  clasesParaConjuros,
  espaciosMaximosPersonaje,
  ordenarIdsConjuro,
  usaPreparadosMulticlase,
} from "@/rules/spells";
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

export type FilaArmasYTrucosPdf = {
  name: string;
  bonus: string;
  damage: string;
  notes: string;
};

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function joinLines(parts: string[]): string {
  return parts.filter(Boolean).join("\n");
}

/** Tabla «Armas y trucos»: armas en combate + trucos/hechizos de ataque (máx. 6). */
export function filasArmasYTrucosPdf(
  character: Character,
  catalog: GameCatalog,
): FilaArmasYTrucosPdf[] {
  const filas: FilaArmasYTrucosPdf[] = [];

  for (const { id, attack } of listarAtaquesFicha(character)) {
    if (id === ATAQUE_DESARMADO_ID) continue;
    filas.push({
      name: attack.name,
      bonus: fmtMod(modificadorAtaque(character, attack)),
      damage: attack.damage ?? "",
      notes: attack.notes ?? "",
    });
  }

  const preparados = usaPreparadosMulticlase(clasesParaConjuros(character));
  const idsConjuroAtaque = ordenarIdsConjuro(
    [
      ...filasConjurosFicha(character, character.spells.cantripsKnown, "cantrip"),
      ...filasConjurosFicha(
        character,
        preparados ? character.spells.spellsPrepared : character.spells.spellsKnown,
        "leveled",
      ),
    ].map((f) => f.spellId),
    (spellId) => {
      const spell = catalog.obtenerConjuro(spellId);
      return {
        level: spell?.level ?? 99,
        name: catalog.t("spells", spellId, spell?.nameEn ?? spellId),
      };
    },
  );

  const spellAtk = modificadorAtaqueConjuro(character);
  for (const spellId of idsConjuroAtaque) {
    const spell = catalog.obtenerConjuro(spellId);
    const meta = metaTiradaConjuro(spellId, spell);
    if (meta.tipo !== "attack") continue;
    const damage = meta.damage
      ? (() => {
          const dice = textoDañoMostradoConjuro(character, spellId, meta.damage, spell?.level);
          return meta.damage.type ? `${dice} ${meta.damage.type}` : dice;
        })()
      : "";
    filas.push({
      name: catalog.t("spells", spellId, spell?.nameEn ?? spellId),
      bonus: spellAtk !== null ? fmtMod(spellAtk) : "",
      damage,
      notes: (spell?.level ?? 0) === 0 ? "Truco" : `Conjuro niv. ${spell?.level}`,
    });
  }

  return filas.slice(0, 6);
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
  const rasgosEspecie = character.identity.speciesId
    ? descripcionOrigenEs("species", character.identity.speciesId, species?.traits)
    : undefined;
  if (rasgosEspecie) text["Atributos de Especie"] = rasgosEspecie;

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

  text["Armas"] = etiquetaListaCompetenciasArmas(character.proficiencies.weaponProficiencies);
  text["Herramientas"] = etiquetaListaCompetenciasHerramientas(
    character.proficiencies.toolProficiencies,
  );
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
    const proficient = esProficientePericia(character, skill);
    checks[map.btn] = proficient;
    text[map.val] = fmtMod(modificadorPericia(character, skill));
  }

  const ataquesPdf = filasArmasYTrucosPdf(character, catalog);
  ataquesPdf.forEach((fila, i) => {
    text[attackRowField(i, "name")] = fila.name;
    text[attackRowField(i, "bonus")] = fila.bonus;
    text[attackRowField(i, "damage")] = fila.damage;
    text[attackRowField(i, "notes")] = fila.notes;
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
  const filasConjuro = [
    ...filasConjurosFicha(character, character.spells.cantripsKnown, "cantrip"),
    ...filasConjurosFicha(
      character,
      preparados ? character.spells.spellsPrepared : character.spells.spellsKnown,
      "leveled",
    ),
  ];
  const spellIds = ordenarIdsConjuro(
    filasConjuro.map((f) => f.spellId),
    (spellId) => {
      const spell = catalog.obtenerConjuro(spellId);
      return {
        level: spell?.level ?? 99,
        name: catalog.t("spells", spellId, spell?.nameEn ?? spellId),
      };
    },
  ).slice(0, 30);
  const filaPorId = new Map(filasConjuro.map((f) => [f.spellId, f]));

  spellIds.forEach((spellId, i) => {
    const spell = catalog.obtenerConjuro(spellId);
    const meta = metaConjuroParaMostrar(spellId, metaTiradaConjuro(spellId, spell));
    const level = spell?.level ?? 0;
    text[spellRowField(i, "name")] = catalog.t("spells", spellId, spell?.nameEn ?? spellId);
    text[spellRowField(i, "level")] = level === 0 ? "0" : String(level);
    if (meta.castingTime) text[spellRowField(i, "time")] = meta.castingTime;
    if (meta.range) text[spellRowField(i, "range")] = meta.range;
    const fila = filaPorId.get(spellId);
    const usosTexto = fila?.usosPorOrigen?.length
      ? fila.usosPorOrigen
          .map((u) => `${ETIQUETA_ORIGEN_CONJURO[u.source]} ${u.restantes}/${u.max}`)
          .join(" · ")
      : fila?.usosLibres
        ? `${fila.usosLibres.restantes}/${fila.usosLibres.max}`
        : null;
    const notaCorta = [fila?.anotacion, usosTexto].filter(Boolean).join(" · ");
    if (notaCorta) text[spellRowField(i, "notes")] = notaCorta;
    if (meta.ritual) checks[spellRowField(i, "ritual")] = true;
    if (catalog.requiereConcentracion(spellId)) checks[spellRowField(i, "concentration")] = true;
    // Casilla AcroForm (no texto): detectar M en componentes SRD o mostrados.
    const componentes = spell?.components ?? meta.components ?? "";
    if (/\bM\b/i.test(componentes)) checks[spellRowField(i, "material")] = true;
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
  return claseArmaduraPersonaje(character);
}
