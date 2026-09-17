import { Button } from "@/components/layout";
import { UsosContador } from "@/components/UsosContador";
import { EtiquetaConcentracion, EtiquetaRitual } from "@/components/spell/SpellRow";
import { SPELL_TABLE_HEADERS } from "@/lib/sheet-layout";
import {
  etiquetaOpcionRanura,
  opcionesRanuraConjuro,
  ranuraAutomaticaConjuro,
  textoDañoMostradoConjuro,
  type OpcionRanuraConjuro,
} from "@/rules/spell-cast";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import {
  ETIQUETA_ORIGEN_CONJURO,
  type FilaConjuroFicha,
  type UsoLibreFicha,
} from "@/rules/spell-grants";
import { metaConjuroParaMostrar } from "@/rules/spell-text";
import { agruparIdsConjuroPorNivel, esSoloMagiaPacto } from "@/rules/spells";
import { nivelRanuraMostrada, proyectilesConjuro } from "@/rules/spell-upcast-text";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import { useMemo, useState } from "react";

function detalleOrigen(
  uso: { source: UsoLibreFicha["source"]; sourceLabel?: string },
  catalog: ReturnType<typeof useCatalogStore.getState>["catalog"],
): string {
  if (uso.source === "species" && uso.sourceLabel) {
    return catalog.t("species", uso.sourceLabel, uso.sourceLabel);
  }
  if (uso.source === "subclass" && uso.sourceLabel) {
    return catalog.t("subclasses", uso.sourceLabel, uso.sourceLabel);
  }
  if (uso.source === "class" && uso.sourceLabel) {
    return catalog.t("classes", uso.sourceLabel, uso.sourceLabel);
  }
  if (uso.sourceLabel) return uso.sourceLabel;
  return ETIQUETA_ORIGEN_CONJURO[uso.source];
}

function claseBadgeOrigen(source: UsoLibreFicha["source"]): string {
  if (source === "species") return "bg-accent/15 text-accent";
  if (source === "subclass") return "bg-[#c4a8e8]/15 text-[#c4a8e8]";
  return "bg-accent/15 text-accent";
}

function etiquetaRecarga(recharge: UsoLibreFicha["recharge"]): string {
  if (recharge === "short") return "descanso corto";
  if (recharge === "long") return "descanso largo";
  return "sin recarga";
}

export function SpellSheetTable({
  rows,
  emptyMessage,
  onRemove,
  onCast,
  onReponerUso,
  onInfo,
  character,
  selectedId = null,
}: {
  rows: FilaConjuroFicha[];
  emptyMessage: string;
  onRemove?: (id: string) => void;
  onCast?: (id: string, resourceId?: string, ranura?: OpcionRanuraConjuro) => void;
  onReponerUso?: (resourceId: string) => void;
  onInfo: (id: string) => void;
  character?: Character;
  selectedId?: string | null;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const [pendienteId, setPendienteId] = useState<string | null>(null);
  const porId = useMemo(() => new Map(rows.map((r) => [r.spellId, r])), [rows]);
  const grupos = useMemo(
    () =>
      agruparIdsConjuroPorNivel(
        rows.map((r) => r.spellId),
        (id) => {
          const spell = catalog.obtenerConjuro(id);
          return {
            level: spell?.level ?? 99,
            name: catalog.t("spells", id, spell?.nameEn ?? id),
          };
        },
      ),
    [rows, catalog],
  );
  const mostrarCabecerasNivel = grupos.some((g) => g.level > 0);
  const soloPacto = character ? esSoloMagiaPacto(character) : false;

  function pedirLanzar(id: string, resourceId?: string) {
    if (!onCast) return;
    if (resourceId) {
      setPendienteId(null);
      onCast(id, resourceId);
      return;
    }
    if (!character) {
      onCast(id);
      return;
    }
    const level = catalog.obtenerConjuro(id)?.level ?? 1;
    const automatica = ranuraAutomaticaConjuro(character, level);
    if (automatica || soloPacto) {
      setPendienteId(null);
      onCast(id, undefined, automatica);
      return;
    }
    setPendienteId((prev) => (prev === id ? null : id));
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="sheet-table-header sheet-spell-grid" aria-hidden>
        {SPELL_TABLE_HEADERS.map((h) => (
          <span key={h}>{h}</span>
        ))}
        <span className="sr-only">Acciones</span>
      </div>
      <ul>
        {grupos.map((grupo) => (
          <li key={`nivel-${grupo.level}`} className="list-none">
            {mostrarCabecerasNivel && (
              <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-muted first:mt-0">
                {grupo.level === 0 ? "Trucos" : `Nivel ${grupo.level}`}
              </p>
            )}
            <ul>
              {grupo.ids.map((id) => {
          const fila = porId.get(id);
          const spell = catalog.obtenerConjuro(id);
          const level = spell?.level ?? 0;
          const meta = metaConjuroParaMostrar(id, metaTiradaConjuro(id, spell));
          const pools = fila?.usosPorOrigen ?? [];
          const hayLibre = pools.some((p) => p.restantes > 0);
          const origenesSinUso = (fila?.origenes ?? []).filter(
            (origen) =>
              !pools.some(
                (p) => p.source === origen.source && p.sourceLabel === origen.sourceLabel,
              ),
          );
          const dadosDaño =
            meta.damage && character
              ? textoDañoMostradoConjuro(character, id, meta.damage, level)
              : meta.damage?.dice;
          const proyectiles =
            character && !dadosDaño
              ? proyectilesConjuro(
                  id,
                  level,
                  nivelRanuraMostrada(character, level),
                  character.identity.level,
                )
              : 1;
          const etiquetaDaño = dadosDaño || (proyectiles > 1 ? `${proyectiles}×` : null);
          const opciones =
            character && pendienteId === id && !hayLibre
              ? opcionesRanuraConjuro(character, level)
              : [];
          return (
            <li
              key={id}
              className={`sheet-table-row sheet-spell-grid items-baseline py-2 ${
                selectedId === id ? "rounded-lg bg-accent/10" : ""
              }`}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-1">
                <button
                  type="button"
                  className={`min-w-0 truncate text-left font-medium hover:text-accent ${
                    selectedId === id ? "text-accent" : ""
                  }`}
                  onClick={() => onInfo(id)}
                  aria-pressed={selectedId === id}
                >
                  {catalog.t("spells", id, spell?.nameEn ?? id)}
                </button>
                {etiquetaDaño && (
                  <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-muted">
                    {etiquetaDaño}
                    {meta.damage?.type ? ` ${meta.damage.type}` : ""}
                  </span>
                )}
                <EtiquetaConcentracion spellId={id} />
                <EtiquetaRitual spellId={id} />
              </div>
              <span className="text-center tabular-nums text-muted">
                {level === 0 ? "0" : level}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">
                {meta.castingTime ?? "—"}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">
                {meta.range ?? "—"}
              </span>
              <span className="flex min-w-0 flex-col items-end gap-1">
                {pools.map((uso) => {
                  const gastados = uso.max - uso.restantes;
                  return (
                    <span
                      key={uso.resourceId}
                      className="flex max-w-full flex-wrap items-center justify-end gap-1"
                    >
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${claseBadgeOrigen(uso.source)}`}
                      >
                        {detalleOrigen(uso, catalog)}
                      </span>
                      <UsosContador restantes={uso.restantes} max={uso.max} compact />
                      <span className="text-[11px] text-muted">
                        {uso.recharge === "short" ? "DC" : uso.recharge === "long" ? "DL" : ""}
                      </span>
                      {onCast && uso.restantes > 0 && (
                        <Button
                          variant="primary"
                          className="min-h-10 px-3 text-sm"
                          onClick={() => pedirLanzar(id, uso.resourceId)}
                        >
                          Lanzar
                        </Button>
                      )}
                      {onReponerUso && gastados > 0 && uso.recharge !== "none" && (
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          title={`Reponer (${etiquetaRecarga(uso.recharge)})`}
                          onClick={() => onReponerUso(uso.resourceId)}
                        >
                          +
                        </Button>
                      )}
                    </span>
                  );
                })}
                {origenesSinUso.map((origen) => (
                  <span
                    key={`${origen.source}:${origen.sourceLabel}`}
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${claseBadgeOrigen(origen.source)}`}
                  >
                    {detalleOrigen(origen, catalog)}
                  </span>
                ))}
                {onCast && !hayLibre && opciones.length > 1 && (
                  <span className="flex max-w-full flex-wrap items-center justify-end gap-1">
                    {opciones.map((opcion) => (
                      <Button
                        key={opcion.tipo === "pact" ? "pact" : opcion.level}
                        variant="primary"
                        className="min-h-10 px-3 text-sm"
                        title="Espacio a gastar (upcast si es mayor que el nivel del conjuro)"
                        onClick={() => {
                          setPendienteId(null);
                          onCast(id, undefined, opcion);
                        }}
                      >
                        {etiquetaOpcionRanura(opcion)}
                      </Button>
                    ))}
                  </span>
                )}
                {onCast && !hayLibre && opciones.length <= 1 && (
                  <Button
                    variant="primary"
                    className="min-h-10 px-3 text-sm"
                    onClick={() => pedirLanzar(id)}
                  >
                    Lanzar
                  </Button>
                )}
                {fila?.sePuedeQuitar && onRemove ? (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => onRemove(id)}
                  >
                    −
                  </Button>
                ) : null}
              </span>
            </li>
          );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
