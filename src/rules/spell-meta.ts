import { srdSpells, type SrdSpell } from "@/rules/srd";

const concentracionSrd = new Map(
  srdSpells.map((spell) => [spell.id, spell.concentration === true]),
);

export function conjuroRequiereConcentracion(
  spellId: string | null | undefined,
  spell?: SrdSpell | null,
): boolean {
  if (!spellId) return false;
  if (spell?.concentration === true) return true;
  return concentracionSrd.get(spellId) ?? false;
}

export function mergeConjurosCatalogo(
  base: SrdSpell[],
  extra: SrdSpell[] | undefined,
): SrdSpell[] {
  const map = new Map(base.map((item) => [item.id, { ...item }]));

  for (const item of extra ?? []) {
    const existing = map.get(item.id);
    map.set(item.id, {
      ...(existing ?? {}),
      ...item,
      srdId: item.srdId ?? existing?.srdId ?? item.id,
      concentration:
        item.concentration === true || existing?.concentration === true,
      castType: item.castType ?? existing?.castType,
      save: item.save ?? existing?.save,
      damage: item.damage ?? existing?.damage,
      castingTime: item.castingTime ?? existing?.castingTime,
      range: item.range ?? existing?.range,
      components: item.components ?? existing?.components,
      duration: item.duration ?? existing?.duration,
      ritual: item.ritual ?? existing?.ritual,
      description: item.description ?? existing?.description,
      areaTags: item.areaTags ?? existing?.areaTags,
    });
  }

  return [...map.values()];
}
