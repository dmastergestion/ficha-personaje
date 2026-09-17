import { useMemo, useState } from "react";
import { Button } from "@/components/layout";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { SpellCatalogRow } from "@/components/spell/SpellCatalogRow";
import { SpellRow } from "@/components/spell/SpellRow";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import type { ClassLevel } from "@/schemas/character";
import {
  conjuroVisibleEnEleccion,
  idsOcupadosSelectorConjuros,
  requisitosConjurosClases,
  type ListaEleccionConjuro,
  type SeleccionConjuros,
} from "@/rules/spell-choices";
import { compararConjurosPorNivel, ordenarIdsConjuro } from "@/rules/spells";
import type { GameCatalog } from "@/rules/catalog";
import type { OriginChoices } from "@/rules/origin-choices";

type ListaConjuro = ListaEleccionConjuro;

function claveLista(lista: ListaConjuro): keyof SeleccionConjuros {
  if (lista === "cantrips") return "cantripsKnown";
  if (lista === "grimorio") return "spellsKnown";
  return "spellsPrepared";
}

export function SpellChoicesForm({
  classes,
  seleccion,
  onChange,
  catalog,
  titulo = "Elige tus conjuros",
  soloAnadir,
  grimorioBase = [],
  idsExcluidos = [],
  originChoices,
}: {
  classes: ClassLevel[];
  seleccion: SeleccionConjuros;
  onChange: (next: SeleccionConjuros) => void;
  catalog: GameCatalog;
  titulo?: string;
  /** Si se define, solo pide añadir esta cantidad (p. ej. al subir de nivel). */
  soloAnadir?: { cantrips: number; grimorio: number; preparados: number };
  grimorioBase?: string[];
  /** Conjuros ya concedidos (especie, subclase, dote…) que no deben reaparecer. */
  idsExcluidos?: string[];
  originChoices?: OriginChoices;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [listaActiva, setListaActiva] = useState<ListaConjuro>("cantrips");
  const [infoConjuroId, setInfoConjuroId] = useState<string | null>(null);

  const claseRef = classes[0] ?? null;
  const max = requisitosConjurosClases(classes, originChoices);
  const objetivo = soloAnadir ?? max;

  const pendiente = {
    cantrips: Math.max(0, objetivo.cantrips - seleccion.cantripsKnown.length),
    grimorio: Math.max(0, objetivo.grimorio - seleccion.spellsKnown.length),
    preparados: Math.max(0, objetivo.preparados - seleccion.spellsPrepared.length),
  };

  const secciones: { id: ListaConjuro; label: string; count: number; max: number }[] = [];
  if (objetivo.cantrips > 0) {
    secciones.push({
      id: "cantrips",
      label: "Trucos",
      count: seleccion.cantripsKnown.length,
      max: objetivo.cantrips,
    });
  }
  if (objetivo.grimorio > 0) {
    secciones.push({
      id: "grimorio",
      label: "Grimorio",
      count: seleccion.spellsKnown.length,
      max: objetivo.grimorio,
    });
  }
  if (objetivo.preparados > 0) {
    secciones.push({
      id: "preparados",
      label: "Preparados",
      count: seleccion.spellsPrepared.length,
      max: objetivo.preparados,
    });
  }

  const listaUi = useMemo(() => {
    const activa = secciones.find((s) => s.id === listaActiva);
    if (activa && activa.count < activa.max) return activa.id;
    return secciones.find((s) => s.count < s.max)?.id ?? secciones[0]?.id ?? "preparados";
  }, [listaActiva, secciones]);

  const filtrados = useMemo(() => {
    if (!claseRef || secciones.length === 0) return [];
    const ocupados = idsOcupadosSelectorConjuros(seleccion, idsExcluidos);
    const grimorio = new Set([...grimorioBase, ...seleccion.spellsKnown]);
    const busq = busqueda.trim().toLowerCase();
    return catalog.spells
      .filter((s) => {
        if (
          !conjuroVisibleEnEleccion({
            spellId: s.id,
            spellLevel: s.level,
            clase: claseRef,
            lista: listaUi,
            idsOcupados: ocupados,
            grimorio,
            requiereGrimorioParaPreparar: max.grimorio > 0,
          })
        ) {
          return false;
        }
        if (!busq) return true;
        return catalog.t("spells", s.id, s.nameEn).toLowerCase().includes(busq);
      })
      .sort((a, b) =>
        compararConjurosPorNivel(
          a.level,
          catalog.t("spells", a.id, a.nameEn),
          b.level,
          catalog.t("spells", b.id, b.nameEn),
        ),
      )
      .slice(0, 40);
  }, [
    catalog,
    busqueda,
    claseRef,
    listaUi,
    secciones.length,
    seleccion,
    idsExcluidos,
    grimorioBase,
    max.grimorio,
  ]);

  if (secciones.length === 0) return null;

  function idsLista(lista: ListaConjuro): string[] {
    return ordenarIdsConjuro(seleccion[claveLista(lista)], (id) => {
      const spell = catalog.spells.find((s) => s.id === id);
      return {
        level: spell?.level ?? 99,
        name: catalog.t("spells", id, spell?.nameEn ?? id),
      };
    });
  }

  function limiteLista(lista: ListaConjuro): number {
    if (lista === "cantrips") return objetivo.cantrips;
    if (lista === "grimorio") return objetivo.grimorio;
    return objetivo.preparados;
  }

  function agregar(spellId: string, level: number) {
    const lista: ListaConjuro = level === 0 ? "cantrips" : listaUi;
    const key = claveLista(lista);
    const actual = seleccion[key];
    if (actual.includes(spellId)) return;
    if (actual.length >= limiteLista(lista)) return;
    const grimorio = new Set([...grimorioBase, ...seleccion.spellsKnown]);
    if (lista === "preparados" && max.grimorio > 0 && !grimorio.has(spellId)) {
      return;
    }
    onChange({ ...seleccion, [key]: [...actual, spellId] });
  }

  function quitar(spellId: string, lista: ListaConjuro) {
    const key = claveLista(lista);
    const next = seleccion[key].filter((id) => id !== spellId);
    if (lista === "grimorio") {
      onChange({
        ...seleccion,
        spellsKnown: next,
        spellsPrepared: seleccion.spellsPrepared.filter((id) => id !== spellId),
      });
      return;
    }
    onChange({ ...seleccion, [key]: next });
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-panel/40 p-3">
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted">
          {pendiente.cantrips > 0 && `Trucos: faltan ${pendiente.cantrips}. `}
          {pendiente.grimorio > 0 && `Grimorio: faltan ${pendiente.grimorio}. `}
          {pendiente.preparados > 0 && `Preparados: faltan ${pendiente.preparados}.`}
          {pendiente.cantrips === 0 &&
            pendiente.grimorio === 0 &&
            pendiente.preparados === 0 &&
            "Selección completa."}
        </p>
      </div>

      {secciones.map((sec) => (
        <section key={sec.id} className="space-y-1">
          <h4 className="text-sm font-semibold">
            {sec.label} ({sec.count}/{sec.max})
          </h4>
          <ul className="space-y-1">
            {idsLista(sec.id).map((id) => (
              <SpellRow
                key={id}
                id={id}
                spellLevel={catalog.spells.find((s) => s.id === id)?.level ?? 0}
                onRemove={() => quitar(id, sec.id)}
                onCast={() => {}}
                onInfo={() => setInfoConjuroId(id)}
              />
            ))}
            {idsLista(sec.id).length === 0 && (
              <li className="text-xs text-muted">Ninguno elegido todavía.</li>
            )}
          </ul>
        </section>
      ))}

      {pendiente.grimorio === 0 &&
        pendiente.preparados > 0 &&
        max.grimorio > 0 &&
        [...grimorioBase, ...seleccion.spellsKnown].length > 0 && (
          <p className="text-xs text-muted">
            Los preparados deben estar en tu grimorio (
            {new Set([...grimorioBase, ...seleccion.spellsKnown]).size} conjuros disponibles).
          </p>
        )}

      {(pendiente.cantrips > 0 || pendiente.grimorio > 0 || pendiente.preparados > 0) && (
        <section className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex flex-wrap gap-2">
            {secciones
              .filter((s) => s.count < s.max)
              .map((s) => (
                <Button
                  key={s.id}
                  variant={listaUi === s.id ? "primary" : "ghost"}
                  className="text-sm"
                  onClick={() => setListaActiva(s.id)}
                >
                  Añadir {s.label.toLowerCase()}
                </Button>
              ))}
          </div>
          <input
            type="search"
            placeholder="Buscar en la lista de clase…"
            className="sheet-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <ul className="max-h-80 overflow-y-auto rounded-lg border border-white/10 bg-surface/40">
            {filtrados.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">
                No hay conjuros disponibles en la lista de esta clase para esta sección.
              </li>
            ) : (
              filtrados.map((s) => {
                const lleno = idsLista(listaUi).length >= limiteLista(listaUi);
                return (
                  <SpellCatalogRow
                    key={s.id}
                    spellId={s.id}
                    name={catalog.t("spells", s.id, s.nameEn)}
                    level={s.level}
                    onInfo={() => setInfoConjuroId(s.id)}
                    onAdd={() => agregar(s.id, s.level)}
                    addDisabled={lleno}
                    addLabel="Añadir"
                  />
                );
              })
            )}
          </ul>
        </section>
      )}

      {infoConjuroId && (
        <div className="rounded-lg border border-white/10 bg-surface p-2">
          <SpellInfoPanel
            spellId={infoConjuroId}
            name={catalog.t("spells", infoConjuroId, infoConjuroId)}
            meta={metaTiradaConjuro(infoConjuroId, catalog.obtenerConjuro(infoConjuroId))}
          />
          <Button variant="ghost" className="mt-2" onClick={() => setInfoConjuroId(null)}>
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}
