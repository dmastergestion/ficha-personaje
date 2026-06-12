import { Button } from "@/components/layout";
import { SPELL_TABLE_HEADERS } from "@/lib/sheet-layout";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import { metaConjuroParaMostrar } from "@/rules/spell-text";
import { useCatalogStore } from "@/stores/catalog-store";

function notaCorta(text: string | undefined, max = 80): string {
  if (!text?.trim()) return "—";
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function SpellSheetTable({
  spellIds,
  emptyMessage,
  onRemove,
  onCast,
  onInfo,
}: {
  spellIds: string[];
  emptyMessage: string;
  onRemove: (id: string) => void;
  onCast: (id: string) => void;
  onInfo: (id: string) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);

  if (spellIds.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="sheet-table-header sheet-spell-grid min-w-[40rem]"
        aria-hidden
      >
        {SPELL_TABLE_HEADERS.map((h) => (
          <span key={h}>{h}</span>
        ))}
        <span />
      </div>
      <ul className="min-w-[40rem]">
        {spellIds.map((id) => {
          const spell = catalog.obtenerConjuro(id);
          const level = spell?.level ?? 0;
          const meta = metaConjuroParaMostrar(
            id,
            metaTiradaConjuro(id, spell),
          );
          const conc = catalog.requiereConcentracion(id);
          const ritual = catalog.esRitual(id);
          return (
            <li key={id} className="sheet-table-row sheet-spell-grid items-center">
              <button
                type="button"
                className="min-w-0 truncate text-left hover:text-gold"
                onClick={() => onInfo(id)}
              >
                {catalog.t("spells", id, spell?.nameEn ?? id)}
              </button>
              <span className="text-center tabular-nums">{level === 0 ? "0" : level}</span>
              <span className="min-w-0 truncate text-xs text-muted">
                {meta.castingTime ?? "—"}
              </span>
              <span className="text-center">{conc ? "✓" : "—"}</span>
              <span className="text-center">{ritual ? "✓" : "—"}</span>
              <span className="min-w-0 truncate text-xs text-muted">
                {meta.components ?? "—"}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">
                {meta.range ?? "—"}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">
                {notaCorta(meta.description)}
              </span>
              <span className="flex shrink-0 gap-0.5">
                <Button variant="combat" className="px-1.5 py-0.5 text-xs" onClick={() => onCast(id)}>
                  Lanzar
                </Button>
                <Button variant="ghost" className="px-1.5 py-0.5 text-xs" onClick={() => onRemove(id)}>
                  −
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
