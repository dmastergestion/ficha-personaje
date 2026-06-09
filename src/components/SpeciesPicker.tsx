import { useMemo } from "react";
import {
  buildSpeciesGroups,
  groupHasVariants,
  resolveSpeciesId,
  splitSpeciesId,
} from "@/rules/species-catalog";
import type { GameCatalog } from "@/rules/catalog";

export function SpeciesPicker({
  catalog,
  speciesId,
  onChange,
  className = "w-full rounded-lg border border-white/10 bg-surface px-3 py-2",
}: {
  catalog: GameCatalog;
  speciesId: string | null;
  onChange: (speciesId: string | null) => void;
  className?: string;
}) {
  const groups = useMemo(
    () =>
      buildSpeciesGroups(catalog.species).sort((a, b) =>
        catalog
          .t("speciesGroups", a.id, a.id)
          .localeCompare(catalog.t("speciesGroups", b.id, b.id), "es"),
      ),
    [catalog],
  );
  const { groupId, variantId } = useMemo(
    () => splitSpeciesId(speciesId, groups),
    [speciesId, groups],
  );

  const activeGroup = groups.find((g) => g.id === groupId) ?? groups[0];
  const showVariants = activeGroup ? groupHasVariants(activeGroup) : false;

  function onGroupChange(nextGroupId: string) {
    const group = groups.find((g) => g.id === nextGroupId);
    if (!group) {
      onChange(null);
      return;
    }
    if (groupHasVariants(group)) {
      onChange(resolveSpeciesId(group.id, group.variantIds[0] ?? null));
    } else {
      onChange(group.id);
    }
  }

  function onVariantChange(nextVariantId: string) {
    if (!activeGroup) return;
    onChange(resolveSpeciesId(activeGroup.id, nextVariantId || null));
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted">Sin especies en el catálogo.</p>;
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Especie</span>
        <select
          className={className}
          value={activeGroup?.id ?? ""}
          onChange={(e) => onGroupChange(e.target.value)}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {catalog.t("speciesGroups", group.id, group.id)}
            </option>
          ))}
        </select>
      </label>

      {showVariants && activeGroup && (
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Linaje / subespecie</span>
          <select
            className={className}
            value={variantId ?? activeGroup.variantIds[0] ?? ""}
            onChange={(e) => onVariantChange(e.target.value)}
          >
            {activeGroup.variantIds.map((id) => (
              <option key={id} value={id}>
                {catalog.t("species", id, id)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
