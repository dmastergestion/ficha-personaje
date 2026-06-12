import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/layout";
import { ABILITY_KEYS, SPELL_SLOT_LEVELS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_LABELS_ES } from "@/rules/character";
import {
  clasesParaConjuros,
  espaciosMaximosPersonaje,
  espaciosPactoMaximos,
  esLanzadorPersonaje,
  nivelBrujo,
  nivelEfectivoConjuro,
  resumenConjuros,
  usaPreparadosMulticlase,
} from "@/rules/spells";
import { cdConjuro, lanzarConjuro, modificadorAtaqueConjuro } from "@/rules/spell-cast";
import {
  atributoConjuroEsFijo,
  atributoConjuroPredeterminado,
  clasesConListaConjuros,
  conjuroDisponibleParaPersonaje,
  nivelMaximoConjuroClase,
} from "@/rules/spell-lists";
import { etiquetaSalvacion, metaTiradaConjuro } from "@/rules/spell-cast-meta";
import {
  ajustarEspaciosRestantes,
  ajustarPactoRestante,
  espaciosRestantesPersonaje,
  pactoRestante,
} from "@/rules/rests";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { EtiquetaConcentracion, EtiquetaRitual } from "@/components/spell/SpellRow";
import { SpellSheetTable } from "@/components/sheet/SpellSheetTable";
import {
  agregarConjuro,
  quitarConjuro,
} from "@/pages/character-sheet/spell-list-mutations";
import { t as tSrd } from "@/rules/srd";
import { FeatSpellsPanel } from "@/components/FeatSpellsPanel";
import { conjurosOtorgadosPorDotes } from "@/rules/feat-mechanics";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

export function TabHechizos({ character, onChange }: SheetTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [infoConjuroId, setInfoConjuroId] = useState<string | null>(null);
  const catalog = useCatalogStore((s) => s.catalog);
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
  const [filtroNivel, setFiltroNivel] = useState(0);

  useEffect(() => {
    if (clasesLista.length === 0) return;
    if (!clasesLista.some((c) => c.classId === filtroClaseId)) {
      setFiltroClaseId(clasesLista[0]!.classId);
    }
  }, [clasesLista, filtroClaseId]);

  useEffect(() => {
    if (filtroNivel > nivelMaxFiltro) {
      setFiltroNivel(nivelMaxFiltro);
    }
  }, [nivelMaxFiltro, filtroNivel]);

  const etiquetaNivelFiltro =
    filtroNivel === 0 ? "Trucos" : String(filtroNivel);
  const atributoFijo = atributoConjuroEsFijo(character);
  const maxSlots = espaciosMaximosPersonaje(character);
  const restantesSlots = espaciosRestantesPersonaje(character);
  const conjurosDote = conjurosOtorgadosPorDotes(character);
  const lanzador = esLanzadorPersonaje(character) || conjurosDote.length > 0;
  const preparados = usaPreparadosMulticlase(classesConjuro);
  const pactMax = espaciosPactoMaximos(classesConjuro);
  const pactRestante = pactoRestante(character);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const cd = cdConjuro(character);
  const ataqueConjuro = modificadorAtaqueConjuro(character);

  const filtrados = useMemo(
    () =>
      catalog.spells
        .filter((s) => {
          const nombre = catalog.t("spells", s.id, s.nameEn).toLowerCase();
          if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
          if (s.level !== filtroNivel) return false;
          if (!claseFiltro) return true;
          return conjuroDisponibleParaPersonaje(s.id, s.level, claseFiltro);
        })
        .slice(0, 30),
    [catalog, busqueda, filtroNivel, claseFiltro],
  );

  function nivelConjuro(spellId: string): number {
    return catalog.spells.find((s) => s.id === spellId)?.level ?? 1;
  }

  function lanzar(spellId: string) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const level = nivelConjuro(spellId);
    const concentracion = catalog.requiereConcentracion(spellId);
    const result = lanzarConjuro(character, level, rollMode, {
      spellId,
      requiereConcentracion: concentracion,
      diceOptions: diceRoll.options,
    });
    if (result.ok) {
      onChange(result.character);
      const baseParts = [level === 0 ? "Truco" : (result.slotGastado ?? "Lanzado")];

      if (result.castType === "attack") {
        baseParts.push(
          `Ataque ${
            ataqueConjuro !== null
              ? ataqueConjuro >= 0
                ? `+${ataqueConjuro}`
                : ataqueConjuro
              : "—"
          }`,
        );
      } else if (result.castType === "save") {
        baseParts.push(
          `Salvación ${result.saveAbility ? etiquetaSalvacion(result.saveAbility) : ""} CD ${result.cd ?? "—"}`.trim(),
        );
      } else {
        baseParts.push(`CD ${result.cd ?? "—"}`);
      }

      if (concentracion) baseParts.push("Concentración activa");

      if (result.damage) {
        const tipo = result.damage.type ? ` ${result.damage.type}` : "";
        baseParts.push(`Daño ${result.damage.formula} = ${result.damage.total}${tipo}`);
      }

      setUltimaTirada(result.roll, baseParts.join(" · "));
    } else {
      setUltimaTirada(null, result.error);
    }
  }

  function actualizarAtributoConjuro(key: AbilityKey | null) {
    onChange({
      ...character,
      spells: { ...character.spells, abilityKey: key },
    });
  }

  if (!lanzador) {
    return (
      <p className="sheet-card text-muted">
        Este personaje no usa conjuros.
      </p>
    );
  }

  if (!esLanzadorPersonaje(character) && conjurosDote.length > 0) {
    return (
      <div className="sheet-tab-stack">
        <FeatSpellsPanel character={character} onChange={onChange} />
        <p className="sheet-card text-sm text-muted">
          Configura trucos y conjuro en Notas → Dotes → Iniciado en la magia. Los recursos sin espacio
          aparecen en Combate → Recursos.
        </p>
      </div>
    );
  }

  const effectiveLevel = nivelEfectivoConjuro(classesConjuro);
  const resumen = resumenConjuros(character);

  const slotsSection =
    effectiveLevel > 0 ? (
      <section className="sheet-card min-w-0 lg:max-w-sm">
        <h3 className="sheet-section-title">
          Espacios de conjuro (nivel efectivo {effectiveLevel})
        </h3>
        <p className="mb-2 text-xs text-muted">Formato: disponibles / total</p>
        <div className="flex flex-wrap gap-1.5">
          {SPELL_SLOT_LEVELS.map((level) => {
            if (maxSlots[level] === 0) return null;
            const restantes = restantesSlots[level];
            return (
              <div
                key={level}
                className="min-w-[4.5rem] flex-1 rounded-lg bg-surface px-1.5 py-1.5 text-center text-sm"
              >
                <div className="text-muted">Niv {level}</div>
                <div className="text-lg font-bold">
                  {restantes}/{maxSlots[level]}
                </div>
                <div className="mt-0.5 flex justify-center gap-0.5">
                  <Button
                    variant="danger"
                    className="px-2 py-0.5"
                    onClick={() => onChange(ajustarEspaciosRestantes(character, level, -1))}
                  >
                    −
                  </Button>
                  <Button
                    className="px-2 py-0.5"
                    onClick={() => onChange(ajustarEspaciosRestantes(character, level, 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {pactMax > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-white/10 pt-2">
            <span className="text-sm font-semibold">
              Magia de pacto (brujo {nivelBrujo(classesConjuro)})
            </span>
            <span className="text-lg font-bold">
              {pactRestante}/{pactMax}
            </span>
            <Button
              variant="danger"
              className="px-2 py-0.5"
              onClick={() => onChange(ajustarPactoRestante(character, -1))}
            >
              −
            </Button>
            <Button className="px-2 py-0.5" onClick={() => onChange(ajustarPactoRestante(character, 1))}>
              +
            </Button>
          </div>
        )}
      </section>
    ) : effectiveLevel === 0 && pactMax > 0 ? (
      <section className="sheet-card min-w-0 lg:max-w-xs">
        <h3 className="sheet-section-title">
          Magia de pacto (brujo {nivelBrujo(classesConjuro)})
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold">
            {pactRestante}/{pactMax}
          </span>
          <Button
            variant="danger"
            className="px-2 py-0.5"
            onClick={() => onChange(ajustarPactoRestante(character, -1))}
          >
            −
          </Button>
          <Button className="px-2 py-0.5" onClick={() => onChange(ajustarPactoRestante(character, 1))}>
            +
          </Button>
        </div>
      </section>
    ) : null;

  return (
    <div className="sheet-tab-stack">
      <FeatSpellsPanel character={character} onChange={onChange} />
      <div className="sheet-tab-grid items-start lg:grid-cols-[minmax(0,1fr)_auto]">
      <section className="sheet-card min-w-0">
        <div className="mb-2 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="min-w-0 flex-1 text-sm text-muted">
            Trucos {resumen.cantrips.actual}/{resumen.cantrips.max}
            {resumen.known.max
              ? ` · Grimorio ${resumen.known.actual}/${resumen.known.max}`
              : null}
            {resumen.prepared
              ? ` · Preparados ${resumen.prepared.actual}/${resumen.prepared.max}`
              : !resumen.known.max
                ? ` · Conocidos ${resumen.known.actual}`
                : null}
            {resumen.cantrips.actual > resumen.cantrips.max && (
              <span className="ml-1 text-amber-400">(sobre el límite)</span>
            )}
            {resumen.prepared && resumen.prepared.actual > resumen.prepared.max && (
              <span className="ml-1 text-amber-400">(sobre el límite)</span>
            )}
          </p>
          <label className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-muted whitespace-nowrap">Atributo de conjuro</span>
            <select
              className="rounded-lg border border-white/10 bg-surface px-2 py-1 disabled:opacity-70"
              value={character.spells.abilityKey ?? atributoConjuroPredeterminado(character) ?? ""}
              disabled={atributoFijo}
              onChange={(e) =>
                actualizarAtributoConjuro((e.target.value as AbilityKey) || null)
              }
            >
              <option value="">Sin definir</option>
              {ABILITY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {ABILITY_LABELS_ES[key]}
                </option>
              ))}
            </select>
          </label>
          <p className="shrink-0 text-sm">
            CD conjuros: <strong>{cd ?? "—"}</strong>
          </p>
          <p className="shrink-0 text-sm">
            Ataque conjuro:{" "}
            <strong>
              {ataqueConjuro !== null ? (ataqueConjuro >= 0 ? `+${ataqueConjuro}` : ataqueConjuro) : "—"}
            </strong>
          </p>
        </div>
        {character.spells.concentratingOn && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm">
            <span>
              Concentración:{" "}
              <strong>
                {catalog.t("spells", character.spells.concentratingOn, character.spells.concentratingOn)}
              </strong>
            </span>
            <Button
              variant="ghost"
              onClick={() =>
                onChange({
                  ...character,
                  spells: { ...character.spells, concentratingOn: null },
                })
              }
            >
              Dejar de concentrar
            </Button>
          </div>
        )}
      </section>
      {slotsSection}
      </div>

      <div className="sheet-tab-grid lg:grid-cols-2">
      <section className="sheet-card lg:col-span-2">
        <h3 className="sheet-section-title">Trucos</h3>
        <SpellSheetTable
          spellIds={character.spells.cantripsKnown}
          emptyMessage="Sin trucos añadidos."
          onRemove={(id) => onChange(quitarConjuro(character, id, "cantrips"))}
          onCast={lanzar}
          onInfo={setInfoConjuroId}
        />
      </section>

      {resumen.known.max ? (
        <section className="sheet-card lg:col-span-2">
          <h3 className="sheet-section-title">Grimorio</h3>
          <SpellSheetTable
            spellIds={character.spells.spellsKnown}
            emptyMessage="Sin conjuros en el grimorio."
            onRemove={(id) => onChange(quitarConjuro(character, id, "known"))}
            onCast={lanzar}
            onInfo={setInfoConjuroId}
          />
        </section>
      ) : null}

      <section className="sheet-card lg:col-span-2">
        <h3 className="sheet-section-title">
          {preparados ? "Conjuros preparados" : "Conjuros conocidos"}
        </h3>
        <SpellSheetTable
          spellIds={preparados ? character.spells.spellsPrepared : character.spells.spellsKnown}
          emptyMessage="Sin conjuros añadidos."
          onRemove={(id) =>
            onChange(quitarConjuro(character, id, preparados ? "prepared" : "known"))
          }
          onCast={lanzar}
          onInfo={setInfoConjuroId}
        />
      </section>
      </div>

      {infoConjuroId && (
        <section className="sheet-card">
          <SpellInfoPanel
            spellId={infoConjuroId}
            name={catalog.t("spells", infoConjuroId, infoConjuroId)}
            meta={metaTiradaConjuro(infoConjuroId, catalog.obtenerConjuro(infoConjuroId))}
          />
          <Button variant="ghost" className="mt-2" onClick={() => setInfoConjuroId(null)}>
            Cerrar
          </Button>
        </section>
      )}

      <section className="sheet-card">
        <h3 className="sheet-section-title">Buscar conjuro SRD</h3>
        <div className="mb-2 flex flex-wrap gap-2">
          <label className="block min-w-[8rem] flex-1 text-sm">
            <span className="text-muted">Lista de clase</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1 text-sm"
              value={claseFiltro?.classId ?? ""}
              onChange={(e) => {
                setFiltroClaseId(e.target.value);
                setFiltroNivel(0);
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
          <label className="block w-24 shrink-0 text-sm">
            <span className="text-muted">{etiquetaNivelFiltro}</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1 text-sm"
              value={filtroNivel}
              aria-label="Nivel de conjuro a buscar"
              onChange={(e) => setFiltroNivel(Number(e.target.value))}
            >
              <option value={0}>Trucos</option>
              {Array.from({ length: nivelMaxFiltro }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-2 text-xs text-muted">
          Mostrando conjuros de la lista de {claseFiltro ? tSrd("classes", claseFiltro.classId, claseFiltro.classId) : "—"}
          {claseFiltro?.classId === "bard" && claseFiltro.level >= 10 ? " (+ clérigo, druida, mago por Secretos mágicos)" : ""}
          {claseFiltro?.subclassId ? ` y subclase` : ""} · {etiquetaNivelFiltro.toLowerCase()}
        </p>
        <input
          className="mb-2 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
          placeholder="Filtrar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {filtrados.length > 0 && (
          <ul className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
            {filtrados.map((spell) => (
              <li key={spell.id} className="flex items-center gap-1 border-b border-white/5 last:border-0">
                <button
                  type="button"
                  className="min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => setInfoConjuroId(spell.id)}
                >
                  {catalog.t("spells", spell.id, spell.nameEn)}
                  <EtiquetaConcentracion spellId={spell.id} />
                  <EtiquetaRitual spellId={spell.id} />{" "}
                  <span className="text-muted">
                    ({spell.level === 0 ? "truco" : `niv ${spell.level}`})
                  </span>
                </button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onChange(agregarConjuro(character, spell.id, spell.level));
                    setBusqueda("");
                  }}
                >
                  Añadir
                </Button>
              </li>
            ))}
          </ul>
        )}
        {filtrados.length === 0 && (
          <p className="text-sm text-muted">Ningún conjuro coincide con los filtros.</p>
        )}
      </section>
    </div>
  );
}
