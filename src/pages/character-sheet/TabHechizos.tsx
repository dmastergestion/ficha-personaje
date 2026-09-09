import { useEffect, useMemo, useRef, useState } from "react";
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
  nivelEspacioPacto,
  resumenConjuros,
  usaPreparadosMulticlase,
} from "@/rules/spells";
import { cdConjuro, lanzarConjuro, modificadorAtaqueConjuro, type OpcionRanuraConjuro } from "@/rules/spell-cast";
import {
  atributoConjuroEsFijo,
  atributoConjuroPredeterminado,
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
import { SpellSheetTable } from "@/components/sheet/SpellSheetTable";
import {
  conjurosOtorgadosLanzables,
  filasConjurosFicha,
  grantLanzableDeConjuro,
  mejorRecursoLibreParaConjuro,
  otorgamientoPorRecursoLibre,
} from "@/rules/spell-grants";
import { ajustarRecurso } from "@/rules/resources-tracker";
import { quitarConjuro } from "@/pages/character-sheet/spell-list-mutations";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";
import { llevaArmaduraSinAdiestramiento } from "@/rules/proficiencies";

export function TabHechizos({ character, onChange }: SheetTabProps) {
  const [infoConjuroId, setInfoConjuroId] = useState<string | null>(null);
  const infoRef = useRef<HTMLElement>(null);
  const catalog = useCatalogStore((s) => s.catalog);
  const classesConjuro = clasesParaConjuros(character);
  const atributoFijo = atributoConjuroEsFijo(character);
  const maxSlots = espaciosMaximosPersonaje(character);
  const restantesSlots = espaciosRestantesPersonaje(character);
  const conjurosOtorgados = conjurosOtorgadosLanzables(character);
  const lanzador = esLanzadorPersonaje(character) || conjurosOtorgados.length > 0;

  const preparados = usaPreparadosMulticlase(classesConjuro);
  const pactMax = espaciosPactoMaximos(classesConjuro);
  const pactRestante = pactoRestante(character);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const cd = cdConjuro(character);
  const ataqueConjuro = modificadorAtaqueConjuro(character);

  function mostrarInfoConjuro(spellId: string) {
    setInfoConjuroId(spellId);
  }

  useEffect(() => {
    if (!infoConjuroId || typeof window === "undefined") return;
    // Solo en móvil: el panel está encima de la lista y conviene acercarlo.
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    infoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [infoConjuroId]);

  function nivelConjuro(spellId: string): number {
    return catalog.spells.find((s) => s.id === spellId)?.level ?? 1;
  }

  function reponerUso(resourceId: string) {
    onChange(ajustarRecurso(character, resourceId, -1));
  }

  function lanzar(spellId: string, resourceId?: string, ranura?: OpcionRanuraConjuro) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const level = nivelConjuro(spellId);
    const concentracion = catalog.requiereConcentracion(spellId);
    const featResourceId =
      resourceId ?? (ranura ? undefined : mejorRecursoLibreParaConjuro(character, spellId));
    const grant = featResourceId
      ? otorgamientoPorRecursoLibre(character, featResourceId)
      : grantLanzableDeConjuro(character, spellId);
    const result = lanzarConjuro(character, level, rollMode, {
      spellId,
      requiereConcentracion: concentracion,
      diceOptions: diceRoll.options,
      abilityKeyOverride: grant?.abilityKey,
      featResourceId,
      slotLevel: ranura?.tipo === "slot" ? ranura.level : undefined,
      usarPacto: ranura?.tipo === "pact",
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

  const effectiveLevel = nivelEfectivoConjuro(classesConjuro);
  const resumen = resumenConjuros(character);
  const sinAdiestramiento = llevaArmaduraSinAdiestramiento(character);
  const filasTrucos = useMemo(
    () => filasConjurosFicha(character, character.spells.cantripsKnown, "cantrip"),
    [character],
  );
  const filasConjuros = useMemo(
    () =>
      filasConjurosFicha(
        character,
        preparados ? character.spells.spellsPrepared : character.spells.spellsKnown,
        "leveled",
      ),
    [character, preparados],
  );

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
              Magia de pacto (brujo {nivelBrujo(classesConjuro)}
              {nivelEspacioPacto(classesConjuro) > 0
                ? ` · niv. ${nivelEspacioPacto(classesConjuro)}`
                : ""}
              )
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
          Magia de pacto (brujo {nivelBrujo(classesConjuro)}
          {nivelEspacioPacto(classesConjuro) > 0
            ? ` · espacios niv. ${nivelEspacioPacto(classesConjuro)}`
            : ""}
          )
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

  function panelInfo() {
    if (!infoConjuroId) {
      return (
        <p className="text-sm leading-relaxed text-muted">
          Pulsa el nombre de un conjuro para ver su descripción aquí.
        </p>
      );
    }
    return (
      <>
        <SpellInfoPanel
          spellId={infoConjuroId}
          name={catalog.t("spells", infoConjuroId, infoConjuroId)}
          meta={metaTiradaConjuro(infoConjuroId, catalog.obtenerConjuro(infoConjuroId))}
          character={character}
        />
        <Button variant="ghost" className="mt-2" onClick={() => setInfoConjuroId(null)}>
          Cerrar
        </Button>
      </>
    );
  }

  return (
    <div className="sheet-tab-stack">
      {sinAdiestramiento && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Llevas armadura o escudo sin adiestramiento: no puedes lanzar conjuros y tienes
          desventaja en pruebas d20 de Fuerza y Destreza. La CA de la armadura se aplica igual.
        </p>
      )}

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

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
        <div className="sheet-tab-stack min-w-0">
          {infoConjuroId && (
            <section ref={infoRef} className="sheet-card scroll-mt-3 lg:hidden">
              {panelInfo()}
            </section>
          )}

          <div className="sheet-tab-grid">
            <details className="sheet-card sheet-details" open>
              <summary>
                Trucos
                <span className="ml-2 font-normal text-muted">{filasTrucos.length}</span>
              </summary>
              <SpellSheetTable
                rows={filasTrucos}
                emptyMessage="Sin trucos. Añádelos en Información."
                onRemove={(id) => onChange(quitarConjuro(character, id, "cantrips"))}
                onCast={lanzar}
                onReponerUso={reponerUso}
                onInfo={mostrarInfoConjuro}
                character={character}
                selectedId={infoConjuroId}
              />
            </details>

            {resumen.known.max ? (
              <details className="sheet-card sheet-details" open>
                <summary>
                  Grimorio
                  <span className="ml-2 font-normal text-muted">
                    {character.spells.spellsKnown.length}
                  </span>
                </summary>
                <SpellSheetTable
                  rows={character.spells.spellsKnown.map((spellId) => ({
                    spellId,
                    sePuedeQuitar: true,
                  }))}
                  emptyMessage="Sin conjuros en el grimorio. Añádelos en Información."
                  onRemove={(id) => onChange(quitarConjuro(character, id, "known"))}
                  onCast={lanzar}
                  onReponerUso={reponerUso}
                  onInfo={mostrarInfoConjuro}
                  character={character}
                  selectedId={infoConjuroId}
                />
              </details>
            ) : null}

            <details className="sheet-card sheet-details" open>
              <summary>
                {preparados ? "Conjuros preparados" : "Conjuros conocidos"}
                <span className="ml-2 font-normal text-muted">{filasConjuros.length}</span>
              </summary>
              <SpellSheetTable
                rows={filasConjuros}
                emptyMessage="Sin conjuros. Añádelos en Información."
                onRemove={(id) =>
                  onChange(quitarConjuro(character, id, preparados ? "prepared" : "known"))
                }
                onCast={lanzar}
                onReponerUso={reponerUso}
                onInfo={mostrarInfoConjuro}
                character={character}
                selectedId={infoConjuroId}
              />
            </details>
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-3 lg:block" aria-label="Detalle del conjuro">
          <section className="sheet-card max-h-[calc(100vh-6rem)] overflow-y-auto">
            {panelInfo()}
          </section>
        </aside>
      </div>
    </div>
  );
}
