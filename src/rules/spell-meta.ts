import { idSrdConjuro, idsEquivalentesConjuro } from "@/rules/spell-aliases";
import { srdSpells, type SrdSpell } from "@/rules/srd";

const concentracionSrd = new Map(
  srdSpells.map((spell) => [spell.id, spell.concentration === true]),
);

const ritualSrd = new Map(srdSpells.map((spell) => [spell.id, spell.ritual === true]));

export function conjuroRequiereConcentracion(
  spellId: string | null | undefined,
  spell?: SrdSpell | null,
): boolean {
  if (!spellId) return false;
  if (spell?.concentration === true) return true;
  if (concentracionSrd.get(spellId) === true) return true;
  const srdId = idSrdConjuro(spellId);
  if (srdId && concentracionSrd.get(srdId) === true) return true;
  return false;
}

export function conjuroEsRitual(
  spellId: string | null | undefined,
  spell?: SrdSpell | null,
): boolean {
  if (!spellId) return false;
  if (spell?.ritual === true) return true;
  if (ritualSrd.get(spellId) === true) return true;
  const srdId = idSrdConjuro(spellId);
  if (srdId && ritualSrd.get(srdId) === true) return true;
  return false;
}

export function mergeConjurosCatalogo(
  base: SrdSpell[],
  extra: SrdSpell[] | undefined,
): SrdSpell[] {
  const map = new Map(base.map((item) => [item.id, { ...item }]));
  const aliasAId = new Map<string, string>();
  for (const id of map.keys()) {
    for (const alias of idsEquivalentesConjuro(id)) aliasAId.set(alias, id);
  }

  for (const item of extra ?? []) {
    const existenteId =
      aliasAId.get(item.id) ??
      [...idsEquivalentesConjuro(item.id)].find((id) => map.has(id));
    if (existenteId) {
      const actual = map.get(existenteId);
      map.set(existenteId, fusionarConjuro(actual, { ...item, id: existenteId }));
      continue;
    }
    map.set(item.id, { ...item });
    for (const alias of idsEquivalentesConjuro(item.id)) aliasAId.set(alias, item.id);
  }

  return [...map.values()];
}

function fusionarConjuro(existing: SrdSpell | undefined, item: SrdSpell): SrdSpell {
  return {
    ...(existing ?? {}),
    ...item,
    srdId: item.srdId ?? existing?.srdId ?? item.id,
    concentration: item.concentration === true || existing?.concentration === true,
    castType: item.castType ?? existing?.castType,
    save: item.save ?? existing?.save,
    damage: item.damage ?? existing?.damage,
    castingTime: item.castingTime ?? existing?.castingTime,
    range: item.range ?? existing?.range,
    components: item.components ?? existing?.components,
    duration: item.duration ?? existing?.duration,
    ritual: item.ritual === true || existing?.ritual === true,
    description: item.description ?? existing?.description,
    areaTags: item.areaTags ?? existing?.areaTags,
  };
}
