import { useMemo, useState } from "react";
import { Button } from "@/components/layout";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { EtiquetaConcentracion, EtiquetaRitual, SpellRow } from "@/components/spell/SpellRow";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import {
  conjuroDisponibleParaPersonaje,
  nivelMaximoConjuroClase,
} from "@/rules/spell-lists";
import type { ClassLevel } from "@/schemas/character";
import type { SeleccionConjuros } from "@/rules/spell-choices";
import { requisitosConjurosClases } from "@/rules/spell-choices";
import type { GameCatalog } from "@/rules/catalog";

type ListaConjuro = "cantrips" | "grimorio" | "preparados";

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
}: {
  classes: ClassLevel[];
  seleccion: SeleccionConjuros;
  onChange: (next: SeleccionConjuros) => void;
  catalog: GameCatalog;
  titulo?: string;
  /** Si se define, solo pide añadir esta cantidad (p. ej. al subir de nivel). */
  soloAnadir?: { cantrips: number; grimorio: number; preparados: number };
  grimorioBase?: string[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [listaActiva, setListaActiva] = useState<ListaConjuro>("cantrips");
  const [infoConjuroId, setInfoConjuroId] = useState<string | null>(null);

  const claseRef = classes[0] ?? null;
  const max = requisitosConjurosClases(classes);
  const objetivo = soloAnadir ?? max;

  const pendiente = {
    cantrips: Math.max(0, objetivo.cantrips - seleccion.cantripsKnown.length),
    grimorio: Math.max(0, objetivo.grimorio - seleccion.spellsKnown.length),
    preparados: Math.max(0, objetivo.preparados - seleccion.spellsPrepared.length),
  };

  const nivelMax = claseRef
    ? nivelMaximoConjuroClase(claseRef.classId, claseRef.level, claseRef.subclassId)
    : 9;

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
    const soloTrucos = listaUi === "cantrips";
    return catalog.spells
      .filter((s) => {
        if (soloTrucos ? s.level !== 0 : s.level < 1) return false;
        if (!soloTrucos && s.level > nivelMax) return false;
        const nombre = catalog.t("spells", s.id, s.nameEn).toLowerCase();
        if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
        return conjuroDisponibleParaPersonaje(s.id, s.level, claseRef);
      })
      .slice(0, 40);
  }, [catalog, busqueda, claseRef, listaUi, nivelMax, secciones.length]);

  if (secciones.length === 0) return null;

  function idsLista(lista: ListaConjuro): string[] {
    return seleccion[claveLista(lista)];
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
    let preparados = seleccion.spellsPrepared;
    if (lista === "grimorio") {
      preparados = preparados.filter((id) => id !== spellId);
    }
    onChange({ ...seleccion, [key]: next, spellsPrepared: preparados });
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-panel/40 p-3">
      <div>
        <p className="text-sm font-medium text-gold">{titulo}</p>
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
                  variant={listaUi === s.id ? "critical" : "ghost"}
                  className="text-xs"
                  onClick={() => setListaActiva(s.id)}
                >
                  Añadir {s.label.toLowerCase()}
                </Button>
              ))}
          </div>
          <input
            type="search"
            placeholder="Buscar en lista SRD…"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {filtrados.length === 0 ? (
              <li className="px-2 py-2 text-xs text-muted">
                No hay conjuros disponibles en la lista SRD para esta sección.
              </li>
            ) : (
              filtrados.map((s) => {
              const enLista = idsLista(listaUi).includes(s.id);
              const bloqueado =
                enLista ||
                idsLista(listaUi).length >= limiteLista(listaUi) ||
                (listaUi === "preparados" &&
                  max.grimorio > 0 &&
                  ![...grimorioBase, ...seleccion.spellsKnown].includes(s.id));
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 px-2 py-1 text-sm"
                >
                  <span>
                    {catalog.t("spells", s.id, s.nameEn)}
                    <span className="ml-1 text-xs text-muted">
                      {s.level === 0 ? "truco" : `niv.${s.level}`}
                    </span>
                    <EtiquetaConcentracion spellId={s.id} />
                    <EtiquetaRitual spellId={s.id} />
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="text-xs" onClick={() => setInfoConjuroId(s.id)}>
                      Info
                    </Button>
                    <Button
                      className="text-xs"
                      disabled={bloqueado}
                      onClick={() => agregar(s.id, s.level)}
                    >
                      {enLista ? "Añadido" : "Añadir"}
                    </Button>
                  </div>
                </li>
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
          <Button variant="ghost" className="mt-2 text-xs" onClick={() => setInfoConjuroId(null)}>
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}
