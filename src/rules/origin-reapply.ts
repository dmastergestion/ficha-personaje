import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import {
  calcularBeneficiosOrigen,
  type OrigenCatalogo,
} from "@/rules/origin-benefits";
import { fusionarEleccionesOrigen } from "@/rules/origin-choices";
import { ajustarPgPorCambioCon, aplicarDeltaPg, sincronizarPgPorDotes } from "@/rules/resources";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import type { Character, CharacterFeat } from "@/schemas/character";

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function quitarUnaDote(feats: CharacterFeat[], featId: string | undefined): CharacterFeat[] {
  if (!featId) return feats;
  const idx = feats.findIndex((f) => f.id === featId);
  if (idx < 0) return feats;
  return feats.filter((_, i) => i !== idx);
}

function deltaAtributos(
  scores: Record<AbilityKey, number>,
  bonuses: Partial<Record<AbilityKey, number>>,
  sign: 1 | -1,
): Record<AbilityKey, number> {
  const out = { ...scores };
  for (const key of ABILITY_KEYS) {
    const extra = (bonuses[key] ?? 0) * sign;
    if (extra) out[key] = Math.min(30, Math.max(1, out[key] + extra));
  }
  return out;
}

export function resumenCambioOrigen(
  character: Character,
  speciesId: string | null,
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): string {
  const oldOrigin = calcularBeneficiosOrigen(
    character.identity.speciesId,
    character.identity.backgroundId,
    character.identity.level,
    catalogo,
    character.originChoices,
  );
  const newChoices = fusionarEleccionesOrigen(speciesId, backgroundId, {
    species: speciesId === character.identity.speciesId ? character.originChoices.species : {},
    background:
      backgroundId === character.identity.backgroundId ? character.originChoices.background : {},
    class: character.originChoices.class,
  }, catalogo);
  const newOrigin = calcularBeneficiosOrigen(
    speciesId,
    backgroundId,
    character.identity.level,
    catalogo,
    newChoices,
  );
  const lineas: string[] = [];
  if (oldOrigin.feat?.name !== newOrigin.feat?.name) {
    lineas.push(
      `Dote de trasfondo: ${oldOrigin.feat?.name ?? "—"} → ${newOrigin.feat?.name ?? "—"}`,
    );
  }
  if (oldOrigin.speciesFeat?.name !== newOrigin.speciesFeat?.name) {
    lineas.push(
      `Dote de especie: ${oldOrigin.speciesFeat?.name ?? "—"} → ${newOrigin.speciesFeat?.name ?? "—"}`,
    );
  }
  const asiOld = ABILITY_KEYS.filter((k) => (oldOrigin.abilityBonuses[k] ?? 0) > 0)
    .map((k) => `${k.toUpperCase()} +${oldOrigin.abilityBonuses[k]}`)
    .join(", ");
  const asiNew = ABILITY_KEYS.filter((k) => (newOrigin.abilityBonuses[k] ?? 0) > 0)
    .map((k) => `${k.toUpperCase()} +${newOrigin.abilityBonuses[k]}`)
    .join(", ");
  if (asiOld !== asiNew) {
    lineas.push(`ASI de trasfondo: ${asiOld || "—"} → ${asiNew || "—"}`);
  }
  lineas.push(`Idiomas: ${newOrigin.languages.join(", ") || "Común"}`);
  return lineas.join("\n") || "Se reaplicarán dote, ASI, idiomas y PG de origen.";
}

/** Quita dotes/ASI/idiomas del origen anterior y aplica el nuevo. */
export function aplicarCambioOrigen(
  character: Character,
  speciesId: string | null,
  backgroundId: string | null,
  originChoices: Character["originChoices"],
  catalogo?: OrigenCatalogo,
): Character {
  const oldOrigin = calcularBeneficiosOrigen(
    character.identity.speciesId,
    character.identity.backgroundId,
    character.identity.level,
    catalogo,
    character.originChoices,
  );
  const newOrigin = calcularBeneficiosOrigen(
    speciesId,
    backgroundId,
    character.identity.level,
    catalogo,
    originChoices,
  );

  let feats = character.feats;
  feats = quitarUnaDote(feats, oldOrigin.feat?.id);
  feats = quitarUnaDote(feats, oldOrigin.speciesFeat?.id);
  const añadir = [newOrigin.speciesFeat, newOrigin.feat].filter(Boolean) as CharacterFeat[];
  for (const feat of añadir) {
    if (feats.some((f) => f.id === feat.id)) continue;
    feats = [
      ...feats,
      { ...feat, instanceId: feat.instanceId ?? crypto.randomUUID() },
    ];
  }

  const oldCon = character.abilities.con;
  const abilities = deltaAtributos(
    deltaAtributos(character.abilities, oldOrigin.abilityBonuses, -1),
    newOrigin.abilityBonuses,
    1,
  );

  const oldSkills = new Set(oldOrigin.skills);
  const skills = uniq([
    ...character.proficiencies.skills.filter((s) => !oldSkills.has(s)),
    ...newOrigin.skills,
  ]) as SkillKey[];

  const oldTools = new Set(oldOrigin.toolProficiencies);
  const toolProficiencies = uniq([
    ...character.proficiencies.toolProficiencies.filter((t) => !oldTools.has(t)),
    ...newOrigin.toolProficiencies,
  ]);

  const oldLangs = new Set(oldOrigin.languages);
  const languages = uniq([
    ...character.proficiencies.languages.filter((l) => !oldLangs.has(l)),
    ...newOrigin.languages,
  ]);

  let next: Character = {
    ...character,
    identity: { ...character.identity, speciesId, backgroundId },
    abilities,
    feats,
    originChoices,
    proficiencies: {
      ...character.proficiencies,
      skills,
      toolProficiencies,
      languages,
    },
  };

  next = aplicarDeltaPg(next, newOrigin.hpBonusTotal - oldOrigin.hpBonusTotal);
  if (abilities.con !== oldCon) {
    next = ajustarPgPorCambioCon(next, oldCon, abilities.con);
  }
  next = sincronizarPgPorDotes(character, next);

  // Quitar recursos de la especie vieja y poblar los de la nueva
  if (speciesId !== character.identity.speciesId) {
    const oldGroup = character.identity.speciesId
      ? inferSpeciesGroupId(character.identity.speciesId)
      : null;
    const prefix = oldGroup ? `species:${oldGroup}:` : null;
    next = {
      ...next,
      resources: next.resources.filter(
        (r) => r.source !== "species" || !prefix || !r.id.startsWith(prefix),
      ),
    };
    next = poblarRecursosSugeridos(next);
  }

  return next;
}

export function reaplicarOrigen(
  character: Character,
  speciesId: string | null,
  backgroundId: string | null,
  catalogo?: OrigenCatalogo,
): Character {
  const originChoices = fusionarEleccionesOrigen(
    speciesId,
    backgroundId,
    {
      species: speciesId === character.identity.speciesId ? character.originChoices.species : {},
      background:
        backgroundId === character.identity.backgroundId
          ? character.originChoices.background
          : {},
      class: character.originChoices.class,
    },
    catalogo,
  );
  return aplicarCambioOrigen(character, speciesId, backgroundId, originChoices, catalogo);
}

/** Reaplica dotes y pericias de origen con las elecciones nuevas (misma especie/trasfondo). */
export function sincronizarEleccionesOrigen(
  character: Character,
  originChoices: Character["originChoices"],
  catalogo?: OrigenCatalogo,
): Character {
  return aplicarCambioOrigen(
    character,
    character.identity.speciesId,
    character.identity.backgroundId,
    originChoices,
    catalogo,
  );
}

export function origenDesincronizado(
  character: Character,
  catalogo?: OrigenCatalogo,
): boolean {
  const origin = calcularBeneficiosOrigen(
    character.identity.speciesId,
    character.identity.backgroundId,
    character.identity.level,
    catalogo,
    character.originChoices,
  );
  for (const feat of [origin.feat, origin.speciesFeat]) {
    if (feat && !character.feats.some((f) => f.id === feat.id)) return true;
  }
  for (const skill of origin.skills) {
    if (!character.proficiencies.skills.includes(skill)) return true;
  }
  return false;
}

/** Añade dotes/pericias de origen que faltan, sin rehacer ASI. */
export function sincronizarDotesYPericiasOrigen(
  character: Character,
  originChoices: Character["originChoices"],
  catalogo?: OrigenCatalogo,
): Character {
  const origin = calcularBeneficiosOrigen(
    character.identity.speciesId,
    character.identity.backgroundId,
    character.identity.level,
    catalogo,
    originChoices,
  );
  let feats = character.feats;
  for (const feat of [origin.speciesFeat, origin.feat]) {
    if (!feat || feats.some((f) => f.id === feat.id)) continue;
    feats = [...feats, { ...feat, instanceId: feat.instanceId ?? crypto.randomUUID() }];
  }
  const skills = uniq([
    ...character.proficiencies.skills,
    ...origin.skills,
  ]) as SkillKey[];
  return {
    ...character,
    feats,
    originChoices,
    proficiencies: { ...character.proficiencies, skills },
  };
}
