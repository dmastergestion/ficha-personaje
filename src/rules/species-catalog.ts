import type { SrdEntry } from "@/rules/srd";

export interface SpeciesGroup {
  id: string;
  variantIds: string[];
}

const PREFIX_GROUPS: { prefix: string; groupId: string }[] = [
  { prefix: "dragonborn-", groupId: "dragonborn" },
  { prefix: "elf-", groupId: "elf" },
  { prefix: "gnome-", groupId: "gnome" },
  { prefix: "goliath-", groupId: "goliath" },
  { prefix: "tiefling-", groupId: "tiefling" },
];

export function inferSpeciesGroupId(speciesId: string): string {
  for (const { prefix, groupId } of PREFIX_GROUPS) {
    if (speciesId.startsWith(prefix)) return groupId;
  }
  return speciesId;
}

export function buildSpeciesGroups(species: SrdEntry[]): SpeciesGroup[] {
  const byGroup = new Map<string, string[]>();

  for (const entry of species) {
    const groupId = inferSpeciesGroupId(entry.id);
    const list = byGroup.get(groupId) ?? [];
    if (groupId === entry.id) {
      if (list.length === 0) list.push(entry.id);
    } else {
      list.push(entry.id);
    }
    byGroup.set(groupId, list);
  }

  return [...byGroup.entries()]
    .map(([id, variantIds]) => ({
      id,
      variantIds: variantIds.sort((a, b) => a.localeCompare(b, "es")),
    }))
    .sort((a, b) => a.id.localeCompare(b.id, "es"));
}

export function groupHasVariants(group: SpeciesGroup): boolean {
  return group.variantIds.length > 1 || group.variantIds[0] !== group.id;
}

export function resolveSpeciesId(groupId: string, variantId: string | null): string | null {
  if (!groupId) return null;
  if (variantId) return variantId;
  return groupId;
}

export function splitSpeciesId(
  speciesId: string | null,
  groups: SpeciesGroup[],
): { groupId: string; variantId: string | null } {
  if (!speciesId) return { groupId: groups[0]?.id ?? "", variantId: null };

  const groupId = inferSpeciesGroupId(speciesId);
  const group = groups.find((g) => g.id === groupId);
  if (!group || !groupHasVariants(group)) {
    return { groupId: speciesId, variantId: null };
  }
  return { groupId, variantId: speciesId };
}
