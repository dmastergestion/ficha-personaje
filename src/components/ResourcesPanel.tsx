import { useEffect, useState } from "react";
import { Button } from "@/components/layout";
import { InfoTrigger } from "@/components/InfoTrigger";
import { ResourceInfoPanel } from "@/components/ResourceInfoPanel";
import { UsosContador } from "@/components/UsosContador";
import { LAY_ON_HANDS_RESOURCE_ID } from "@/rules/resource-ids";
import {
  esCuracionPorPuntos,
  esCuracionSimple,
  maxPuntosPorUso,
  recursoOcultoEnPanelUsos,
  usarRecursoFicha,
} from "@/rules/resource-use";
import {
  dadoSuperioridad,
  maniobraPorId,
  maniobrasConocidas,
  nivelMaestroBatalla,
  SUPERIORITY_DICE_ID,
  usarManiobra,
} from "@/rules/battle-master";
import {
  ajustarRecurso,
  etiquetaOrigenRecurso,
  poblarRecursosSugeridos,
} from "@/rules/resources-tracker";
import { descripcionRecurso, resumenRecurso } from "@/rules/resource-text";
import { otorgamientoPorRecursoLibre } from "@/rules/spell-grants";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

function etiquetaOrigen(
  r: Character["resources"][number],
  catalog: ReturnType<typeof useCatalogStore.getState>["catalog"],
): string {
  const base = etiquetaOrigenRecurso(r.source ?? "class");
  if (r.source === "class" && r.sourceLabel) {
    return `${base} · ${catalog.t("classes", r.sourceLabel, r.sourceLabel)}`;
  }
  if (r.source === "feat" && r.sourceLabel) {
    return `${base} · ${r.sourceLabel}`;
  }
  if (r.source === "species" && r.sourceLabel) {
    return `${base} · ${catalog.t("species", r.sourceLabel, r.sourceLabel)}`;
  }
  if (r.source === "subclass" && r.sourceLabel) {
    return `${base} · ${catalog.t("subclasses", r.sourceLabel, r.sourceLabel)}`;
  }
  if (r.sourceLabel) return `${base} · ${r.sourceLabel}`;
  return base;
}

function recarga(recharge: Character["resources"][number]["recharge"]): string {
  if (recharge === "short") return "descanso corto";
  if (recharge === "long") return "descanso largo";
  return "sin recarga";
}

function aplicarResultado(
  onChange: (next: Character) => void,
  result: { ok: true; character: Character; mensaje?: string } | { ok: false; error: string },
) {
  if (!result.ok) {
    window.alert(result.error);
    return;
  }
  onChange(result.character);
  if (result.mensaje) {
    useUiStore.getState().setUltimaTirada(null, result.mensaje);
  }
}

export function ResourcesPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const conocidas = maniobrasConocidas(character);
  const [maniobraId, setManiobraId] = useState(conocidas[0] ?? "");
  const visibles = character.resources.filter(
    (r) =>
      !otorgamientoPorRecursoLibre(character, r.id) &&
      !recursoOcultoEnPanelUsos(r.id),
  );
  const dieSup = dadoSuperioridad(nivelMaestroBatalla(character));

  useEffect(() => {
    if (character.resources.length > 0) return;
    const next = poblarRecursosSugeridos(character);
    if (next.resources.length === 0) return;
    onChange(next);
  }, [character.id, character.resources.length]);

  if (character.resources.length > 0 && visibles.length === 0) return null;

  return (
    <section className="sheet-card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="sheet-section-title mb-0">Usos restantes</h3>
        <Button
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => onChange(poblarRecursosSugeridos(character))}
        >
          Recargar lista
        </Button>
      </div>
      {character.resources.length === 0 ? (
        <p className="text-sm text-muted">Cargando usos de clase, especie y rasgos…</p>
      ) : (
        <ul className="space-y-2">
          {visibles.map((r) => {
            const restantes = Math.max(0, r.max - r.used);
            const nombre = r.id === SUPERIORITY_DICE_ID ? `${r.name} (${dieSup})` : r.name;
            const texto = descripcionRecurso(character, r) ?? "Sin texto en el catálogo.";
            const origen = etiquetaOrigen(r, catalog);
            const recargaTxt = recarga(r.recharge);
            const idManiobra = conocidas.includes(maniobraId) ? maniobraId : conocidas[0];
            const maniobra = idManiobra ? maniobraPorId(idManiobra) : undefined;
            return (
              <li key={r.id} className="rounded-lg border border-white/10 bg-surface/40 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-0.5">
                    <p className="truncate font-medium">{nombre}</p>
                    <InfoTrigger
                      tip={resumenRecurso(texto)}
                      title={r.name}
                      panel={
                        <ResourceInfoPanel
                          origen={origen}
                          recarga={recargaTxt}
                          texto={texto}
                        />
                      }
                      className="h-5 w-5 shrink-0 text-[10px]"
                    />
                  </div>
                  <UsosContador restantes={restantes} max={r.max} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1">
                  {r.id === SUPERIORITY_DICE_ID ? null : esCuracionPorPuntos(r.id) ? (
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="number"
                        min={1}
                        max={maxPuntosPorUso(r.id, restantes)}
                        defaultValue={1}
                        className="sheet-input-compact w-12"
                        aria-label={
                          r.id === LAY_ON_HANDS_RESOURCE_ID
                            ? "Puntos de imposición a gastar"
                            : "Dados de luz curativa a gastar"
                        }
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const n = Number((e.target as HTMLInputElement).value);
                          aplicarResultado(
                            onChange,
                            usarRecursoFicha(character, r.id, { puntos: n }),
                          );
                        }}
                      />
                      <Button
                        variant="success"
                        className="min-h-10 px-3 text-sm"
                        disabled={restantes <= 0}
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector(
                            "input",
                          ) as HTMLInputElement | null;
                          const n = Number(input?.value ?? 1);
                          aplicarResultado(
                            onChange,
                            usarRecursoFicha(character, r.id, { puntos: n }),
                          );
                        }}
                      >
                        Curar
                      </Button>
                    </label>
                  ) : esCuracionSimple(r.id) ? (
                    <Button
                      variant="success"
                      className="min-h-10 px-3 text-sm"
                      disabled={restantes <= 0}
                      onClick={() =>
                        aplicarResultado(onChange, usarRecursoFicha(character, r.id))
                      }
                    >
                      Curar
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        className="min-h-10 px-3 text-sm"
                        disabled={r.recharge === "none" || restantes <= 0}
                        aria-label={`Usar ${nombre} (${restantes} de ${r.max})`}
                        onClick={() =>
                          aplicarResultado(onChange, usarRecursoFicha(character, r.id))
                        }
                      >
                        Usar
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        disabled={r.recharge === "none" || r.used <= 0}
                        aria-label={`Devolver un uso de ${nombre}`}
                        onClick={() => onChange(ajustarRecurso(character, r.id, -1))}
                      >
                        Devolver
                      </Button>
                    </>
                  )}
                </div>
                {r.id === SUPERIORITY_DICE_ID && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {conocidas.length === 0 ? (
                      <p className="text-xs text-muted">Elige maniobras en Resumen.</p>
                    ) : (
                      <>
                        <select
                          className="sheet-input-sm min-w-0 flex-1 py-0.5 text-xs"
                          aria-label="Maniobra"
                          value={idManiobra}
                          onChange={(e) => setManiobraId(e.target.value)}
                        >
                          {conocidas.map((id) => (
                            <option key={id} value={id}>
                              {maniobraPorId(id)?.nameEs ?? id}
                            </option>
                          ))}
                        </select>
                        {maniobra?.hint && (
                          <InfoTrigger
                            tip={maniobra.hint}
                            title={maniobra.nameEs}
                            panel={<ResourceInfoPanel texto={maniobra.hint} />}
                            className="h-5 w-5 shrink-0 text-[10px]"
                          />
                        )}
                        <Button
                          variant="primary"
                          className="min-h-10 px-3 text-sm"
                          disabled={restantes <= 0}
                          onClick={() =>
                            aplicarResultado(
                              onChange,
                              usarManiobra(character, idManiobra!),
                            )
                          }
                        >
                          Usar
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
