import { useEffect, useMemo, useState } from "react";
import { SpellCatalogRow } from "@/components/spell/SpellCatalogRow";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { Button } from "@/components/layout";
import { agregarConjuro } from "@/pages/character-sheet/spell-list-mutations";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { metaTiradaConjuro } from "@/rules/spell-cast-meta";
import {
  clasesConListaConjuros,
  conjuroDisponibleParaPersonaje,
  nivelMaximoConjuroClase,
} from "@/rules/spell-lists";
import { compararConjurosPorNivel, clasesParaConjuros } from "@/rules/spells";
import { idsConjurosAsignados } from "@/rules/spell-grants";
import { t as tSrd } from "@/rules/srd";
import { useCatalogStore } from "@/stores/catalog-store";

export function SpellCatalogPanel({ character, onChange }: SheetTabProps) {
  const catalog = useCatalogStore((s) => s.catalog);
  const [busqueda, setBusqueda] = useState("");
  const [infoConjuroId, setInfoConjuroId] = useState<string | null>(null);
  const classesConjuro = clasesParaConjuros(character);
  const clasesLista = useMemo(
    () => clasesConListaConjuros(classesConjuro),
    [classesConjuro],
  );
  const [filtroClaseId, setFiltroClaseId] = useState("");
  const claseFiltro =
    clasesLista.find((c) => c.classId === filtroClaseId) ?? clasesLista[0] ?? null;
  const nivelMaxFiltro = claseFiltro
    ? nivelMaximoConjuroClase(claseFiltro.classId, claseFiltro.level, claseFiltro.subclassId)
    : 9;
  const nivelInicial = nivelMaxFiltro >= 1 ? 1 : 0;
  const [filtroNivel, setFiltroNivel] = useState<number | "todos">(nivelInicial);

  useEffect(() => {
    if (clasesLista.length === 0) return;
    if (!clasesLista.some((c) => c.classId === filtroClaseId)) {
      setFiltroClaseId(clasesLista[0]!.classId);
    }
  }, [clasesLista, filtroClaseId]);

  useEffect(() => {
    if (filtroNivel === "todos") return;
    if (filtroNivel > nivelMaxFiltro) {
      setFiltroNivel(nivelMaxFiltro >= 1 ? 1 : 0);
    }
  }, [nivelMaxFiltro, filtroNivel]);

  const asignados = useMemo(() => idsConjurosAsignados(character), [character]);

  const [mostrarFueraLista, setMostrarFueraLista] = useState(false);

  const coincidencias = useMemo(
    () =>
      catalog.spells.filter((s) => {
        if (asignados.has(s.id)) return false;
        const nombre = catalog.t("spells", s.id, s.nameEn).toLowerCase();
        if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
        if (filtroNivel !== "todos" && s.level !== filtroNivel) return false;
        if (!claseFiltro) return false;
        const enLista = conjuroDisponibleParaPersonaje(s.id, s.level, claseFiltro);
        if (!enLista && !mostrarFueraLista) return false;
        return true;
      }).sort((a, b) =>
        compararConjurosPorNivel(
          a.level,
          catalog.t("spells", a.id, a.nameEn),
          b.level,
          catalog.t("spells", b.id, b.nameEn),
        ),
      ),
    [catalog, busqueda, filtroNivel, claseFiltro, asignados, mostrarFueraLista],
  );
  const filtrados = coincidencias;

  if (clasesLista.length === 0) return null;

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Conjuros que aún no tienes</h3>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="block min-w-[10rem] flex-1 text-sm">
          <span className="text-muted">Lista de clase</span>
          <select
            className="sheet-select mt-1"
            value={claseFiltro?.classId ?? ""}
            onChange={(e) => {
              setFiltroClaseId(e.target.value);
              const max = clasesLista.find((c) => c.classId === e.target.value);
              const tope = max
                ? nivelMaximoConjuroClase(max.classId, max.level, max.subclassId)
                : 9;
              setFiltroNivel(tope >= 1 ? 1 : 0);
            }}
          >
            {clasesLista.map((cl) => (
              <option key={cl.classId} value={cl.classId}>
                {tSrd("classes", cl.classId, cl.classId)}
                {cl.subclassId ? ` · ${tSrd("subclasses", cl.subclassId, cl.subclassId)}` : ""}
                {` (niv. ${cl.level})`}
              </option>
            ))}
          </select>
        </label>
        <label className="block w-28 shrink-0 text-sm">
          <span className="text-muted">Nivel</span>
          <select
            className="sheet-select mt-1"
            value={String(filtroNivel)}
            aria-label="Nivel de conjuro a buscar"
            onChange={(e) => {
              const v = e.target.value;
              setFiltroNivel(v === "todos" ? "todos" : Number(v));
            }}
          >
            <option value="todos">Todos</option>
            <option value={0}>Trucos</option>
            {Array.from({ length: nivelMaxFiltro }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {claseFiltro?.classId === "bard" && claseFiltro.level >= 10 && (
        <p className="mb-2 text-sm text-muted">
          Incluye listas de clérigo, druida y mago (Secretos mágicos).
        </p>
      )}
      <input
        className="sheet-input mb-3"
        placeholder="Filtrar por nombre…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mostrarFueraLista}
          onChange={(e) => setMostrarFueraLista(e.target.checked)}
        />
        Mostrar conjuros fuera de lista
      </label>
      {filtrados.length > 0 && (
        <>
          <p className="mb-1 text-xs text-muted">{filtrados.length} conjuros</p>
          <ul className="max-h-[28rem] overflow-y-auto rounded-lg border border-white/10 bg-surface/40">
          {filtrados.map((spell) => (
            <SpellCatalogRow
              key={spell.id}
              spellId={spell.id}
              name={catalog.t("spells", spell.id, spell.nameEn)}
              level={spell.level}
              onInfo={() => setInfoConjuroId(spell.id)}
              onAdd={() => {
                const enLista = claseFiltro
                  ? conjuroDisponibleParaPersonaje(spell.id, spell.level, claseFiltro)
                  : true;
                if (
                  !enLista &&
                  !window.confirm(
                    `«${catalog.t("spells", spell.id, spell.nameEn)}» no está en tu lista. ¿Añadirlo igual (contenido propio)?`,
                  )
                ) {
                  return;
                }
                onChange(agregarConjuro(character, spell.id, spell.level));
                setBusqueda("");
              }}
            />
          ))}
        </ul>
        </>
      )}
      {filtrados.length === 0 && (
        <p className="text-sm text-muted">Ningún conjuro coincide con los filtros.</p>
      )}
      {infoConjuroId && (
        <div className="mt-3 rounded-lg border border-white/10 bg-surface p-3">
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
    </section>
  );
}
