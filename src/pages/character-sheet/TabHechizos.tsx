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
import {
  etiquetaSalvacion,
  etiquetaTipoConjuro,
  metaTiradaConjuro,
} from "@/rules/spell-cast-meta";
import {
  ajustarEspaciosRestantes,
  ajustarPactoRestante,
  espaciosRestantesPersonaje,
  pactoRestante,
} from "@/rules/rests";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { FeatPicker } from "@/components/FeatPicker";
import {
  CharacterCompetenciesSection,
  CharacterLanguagesSection,
} from "@/components/CharacterProficienciesSection";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { t as tSrd } from "@/rules/srd";
import { useCatalogStore } from "@/stores/catalog-store";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useUiStore } from "@/stores/ui-store";

function agregarConjuro(
  character: SheetTabProps["character"],
  spellId: string,
  level: number,
): SheetTabProps["character"] {
  if (level === 0) {
    if (character.spells.cantripsKnown.includes(spellId)) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: [...character.spells.cantripsKnown, spellId],
      },
    };
  }

  if (usaPreparadosMulticlase(character.identity.classes)) {
    if (character.spells.spellsPrepared.includes(spellId)) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: [...character.spells.spellsPrepared, spellId],
      },
    };
  }

  if (character.spells.spellsKnown.includes(spellId)) return character;
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: [...character.spells.spellsKnown, spellId],
    },
  };
}

function quitarConjuro(
  character: SheetTabProps["character"],
  spellId: string,
  list: "cantrips" | "known" | "prepared",
): SheetTabProps["character"] {
  if (list === "cantrips") {
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: character.spells.cantripsKnown.filter((s) => s !== spellId),
      },
    };
  }
  if (list === "prepared") {
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: character.spells.spellsPrepared.filter((s) => s !== spellId),
      },
    };
  }
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: character.spells.spellsKnown.filter((s) => s !== spellId),
    },
  };
}

function EtiquetaConcentracion({ spellId }: { spellId: string }) {
  const catalog = useCatalogStore((s) => s.catalog);
  if (!catalog.requiereConcentracion(spellId)) return null;
  return (
    <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
      Conc.
    </span>
  );
}

function EtiquetaTipoTirada({ spellId }: { spellId: string }) {
  const catalog = useCatalogStore((s) => s.catalog);
  const meta = metaTiradaConjuro(spellId, catalog.obtenerConjuro(spellId));
  const estilo =
    meta.tipo === "attack"
      ? "bg-red-500/20 text-red-300"
      : meta.tipo === "save"
        ? "bg-sky-500/20 text-sky-300"
        : "bg-white/10 text-muted";
  const texto =
    meta.tipo === "save" && meta.save
      ? `Salv. ${etiquetaSalvacion(meta.save)}`
      : etiquetaTipoConjuro(meta.tipo);
  return (
  <>
    <span
      className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estilo}`}
    >
      {texto}
    </span>
    {meta.damage && (
      <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">
        {meta.damage.dice}
        {meta.damage.type ? ` ${meta.damage.type}` : ""}
      </span>
    )}
  </>
  );
}

function SpellRow({
  id,
  spellLevel,
  onRemove,
  onCast,
  onInfo,
}: {
  id: string;
  spellLevel: number;
  onRemove: () => void;
  onCast: () => void;
  onInfo: () => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <button type="button" className="min-w-0 text-left hover:text-gold" onClick={onInfo}>
        {catalog.t("spells", id, id)}
        <EtiquetaTipoTirada spellId={id} />
        <EtiquetaConcentracion spellId={id} />
        {spellLevel > 0 && <span className="text-muted"> (niv {spellLevel})</span>}
      </button>
      <div className="flex gap-1">
        <Button variant="ghost" onClick={onInfo}>
          Info
        </Button>
        <Button variant="critical" onClick={onCast}>
          Lanzar
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          Quitar
        </Button>
      </div>
    </li>
  );
}

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
  const [filtroNivelMax, setFiltroNivelMax] = useState<number | "">("");
  const nivelTope =
    filtroNivelMax === "" ? nivelMaxFiltro : Math.min(filtroNivelMax, nivelMaxFiltro);
  const atributoFijo = atributoConjuroEsFijo(character);
  const maxSlots = espaciosMaximosPersonaje(character);
  const restantesSlots = espaciosRestantesPersonaje(character);
  const lanzador = esLanzadorPersonaje(character);
  const preparados = usaPreparadosMulticlase(classesConjuro);
  const pactMax = espaciosPactoMaximos(classesConjuro);
  const pactRestante = pactoRestante(character);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const cd = cdConjuro(character);
  const ataqueConjuro = modificadorAtaqueConjuro(character);

  useEffect(() => {
    if (character.spells.abilityKey) return;
    const key = atributoConjuroPredeterminado(character);
    if (!key) return;
    onChange({
      ...character,
      spells: { ...character.spells, abilityKey: key },
    });
  }, [character.identity.classes, character.spells.abilityKey]);

  useEffect(() => {
    if (clasesLista.length === 0) return;
    if (!clasesLista.some((c) => c.classId === filtroClaseId)) {
      setFiltroClaseId(clasesLista[0]!.classId);
    }
  }, [clasesLista, filtroClaseId]);

  const filtrados = catalog.spells
    .filter((s) => {
      const nombre = catalog.t("spells", s.id, s.nameEn).toLowerCase();
      if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
      if (s.level > nivelTope) return false;
      if (!claseFiltro) return true;
      return conjuroDisponibleParaPersonaje(s.id, s.level, claseFiltro);
    })
    .slice(0, 30);

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

  const effectiveLevel = nivelEfectivoConjuro(classesConjuro);
  const resumen = resumenConjuros(character);

  return (
    <div className="space-y-4">
      <section className="sheet-card">
        <p className="mb-2 text-sm text-muted">
          Trucos {resumen.cantrips.actual}/{resumen.cantrips.max}
          {resumen.prepared
            ? ` · Preparados ${resumen.prepared.actual}/${resumen.prepared.max}`
            : ` · Conocidos ${resumen.known.actual}`}
          {resumen.cantrips.actual > resumen.cantrips.max && (
            <span className="ml-1 text-amber-400">(sobre el límite)</span>
          )}
          {resumen.prepared && resumen.prepared.actual > resumen.prepared.max && (
            <span className="ml-1 text-amber-400">(sobre el límite)</span>
          )}
        </p>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-muted">Atributo de conjuro</span>
            <select
              className="mt-1 block rounded-lg border border-white/10 bg-surface px-2 py-1 disabled:opacity-70"
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
            {atributoFijo && (
              <span className="mt-0.5 block text-xs text-muted">
                Fijado por tu clase según las reglas.
              </span>
            )}
          </label>
          <p className="text-sm">
            CD conjuros: <strong>{cd ?? "—"}</strong>
          </p>
          <p className="text-sm">
            Ataque conjuro:{" "}
            <strong>
              {ataqueConjuro !== null ? (ataqueConjuro >= 0 ? `+${ataqueConjuro}` : ataqueConjuro) : "—"}
            </strong>
          </p>
        </div>
        {character.spells.concentratingOn && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm">
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

      {effectiveLevel > 0 && (
        <section className="sheet-card">
          <h3 className="mb-3 font-semibold">
            Espacios de conjuro (nivel efectivo {effectiveLevel})
          </h3>
          <p className="mb-2 text-xs text-muted">Formato: disponibles / total</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SPELL_SLOT_LEVELS.map((level) => {
              if (maxSlots[level] === 0) return null;
              const restantes = restantesSlots[level];
              return (
                <div key={level} className="rounded-lg bg-surface p-2 text-center text-sm">
                  <div className="text-muted">Niv {level}</div>
                  <div className="text-lg font-bold">
                    {restantes}/{maxSlots[level]}
                  </div>
                  <div className="mt-1 flex justify-center gap-1">
                    <Button
                      variant="critical"
                      onClick={() => onChange(ajustarEspaciosRestantes(character, level, -1))}
                    >
                      −
                    </Button>
                    <Button onClick={() => onChange(ajustarEspaciosRestantes(character, level, 1))}>
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pactMax > 0 && (
        <section className="sheet-card">
          <h3 className="mb-3 font-semibold">
            Magia de pacto (brujo {nivelBrujo(classesConjuro)})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">
              {pactRestante}/{pactMax}
            </span>
            <Button variant="critical" onClick={() => onChange(ajustarPactoRestante(character, -1))}>
              −
            </Button>
            <Button onClick={() => onChange(ajustarPactoRestante(character, 1))}>+</Button>
          </div>
        </section>
      )}

      <section className="sheet-card">
        <h3 className="mb-2 font-semibold">Buscar conjuro SRD</h3>
        <div className="mb-2 flex flex-wrap gap-2">
          <label className="block min-w-[8rem] flex-1 text-sm">
            <span className="text-muted">Lista de clase</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1 text-sm"
              value={claseFiltro?.classId ?? ""}
              onChange={(e) => {
                setFiltroClaseId(e.target.value);
                setFiltroNivelMax("");
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
          <label className="block w-28 text-sm">
            <span className="text-muted">Hasta niv.</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1 text-sm"
              value={filtroNivelMax === "" ? nivelMaxFiltro : filtroNivelMax}
              onChange={(e) => setFiltroNivelMax(Number(e.target.value))}
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
          {claseFiltro?.subclassId ? ` y subclase` : ""} · hasta nivel {nivelTope || "trucos"}
        </p>
        <input
          className="mb-2 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
          placeholder="Filtrar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {filtrados.length > 0 && (
          <ul className="mb-3 max-h-48 overflow-y-auto rounded-lg border border-white/10">
            {filtrados.map((spell) => (
              <li key={spell.id} className="flex items-center gap-1 border-b border-white/5 last:border-0">
                <button
                  type="button"
                  className="min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => setInfoConjuroId(spell.id)}
                >
                  {catalog.t("spells", spell.id, spell.nameEn)}
                  <EtiquetaConcentracion spellId={spell.id} />{" "}
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
          <p className="mb-2 text-sm text-muted">
            Ningún conjuro coincide con los filtros.
          </p>
        )}
        {infoConjuroId && (
          <div className="mt-2">
            <SpellInfoPanel
              name={catalog.t("spells", infoConjuroId, infoConjuroId)}
              meta={metaTiradaConjuro(infoConjuroId, catalog.obtenerConjuro(infoConjuroId))}
            />
            <Button variant="ghost" className="mt-2" onClick={() => setInfoConjuroId(null)}>
              Cerrar
            </Button>
          </div>
        )}
      </section>

      <section className="sheet-card">
        <h3 className="mb-2 font-semibold">Trucos</h3>
        <ul className="space-y-1">
          {character.spells.cantripsKnown.map((id) => (
            <SpellRow
              key={id}
              id={id}
              spellLevel={0}
              onRemove={() => onChange(quitarConjuro(character, id, "cantrips"))}
              onCast={() => lanzar(id)}
              onInfo={() => setInfoConjuroId(id)}
            />
          ))}
          {character.spells.cantripsKnown.length === 0 && (
            <li className="text-sm text-muted">Sin trucos añadidos.</li>
          )}
        </ul>
      </section>

      <section className="sheet-card">
        <h3 className="mb-2 font-semibold">
          {preparados ? "Conjuros preparados" : "Conjuros conocidos"}
        </h3>
        <ul className="space-y-1">
          {(preparados ? character.spells.spellsPrepared : character.spells.spellsKnown).map(
            (id) => (
              <SpellRow
                key={id}
                id={id}
                spellLevel={nivelConjuro(id)}
                onRemove={() =>
                  onChange(quitarConjuro(character, id, preparados ? "prepared" : "known"))
                }
                onCast={() => lanzar(id)}
                onInfo={() => setInfoConjuroId(id)}
              />
            ),
          )}
          {(preparados ? character.spells.spellsPrepared : character.spells.spellsKnown)
            .length === 0 && <li className="text-sm text-muted">Sin conjuros añadidos.</li>}
        </ul>
      </section>

      {infoConjuroId && !busqueda && (
        <section className="sheet-card">
          <SpellInfoPanel
            name={catalog.t("spells", infoConjuroId, infoConjuroId)}
            meta={metaTiradaConjuro(infoConjuroId, catalog.obtenerConjuro(infoConjuroId))}
          />
          <Button variant="ghost" className="mt-2" onClick={() => setInfoConjuroId(null)}>
            Cerrar
          </Button>
        </section>
      )}
    </div>
  );
}

const ROLEPLAY_FIELDS = [
  { key: "appearance" as const, label: "Apariencia" },
  { key: "personalityTraits" as const, label: "Rasgos de personalidad" },
  { key: "ideals" as const, label: "Ideales" },
  { key: "bonds" as const, label: "Vínculos" },
  { key: "flaws" as const, label: "Defectos" },
];

export function TabNotas({ character, onChange }: SheetTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
      <section className="sheet-card">
        <h3 className="sheet-section-title">Trasfondo y personalidad</h3>
        <div className="space-y-3">
          {ROLEPLAY_FIELDS.map(({ key, label }) => (
            <label key={key} className="block space-y-1 text-sm">
              <span className="text-muted">{label}</span>
              <textarea
                className="min-h-16 w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={character.roleplay[key]}
                onChange={(e) =>
                  onChange({
                    ...character,
                    roleplay: { ...character.roleplay, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </section>
      <div className="space-y-4">
        <CharacterLanguagesSection character={character} onChange={onChange} />
        <CharacterCompetenciesSection character={character} />
        <FeatPicker
          feats={character.feats}
          onAdd={(feat) => onChange({ ...character, feats: [...character.feats, feat] })}
          onRemove={(id) =>
            onChange({ ...character, feats: character.feats.filter((f) => f.id !== id) })
          }
        />
      </div>
      </div>
      <section className="sheet-card">
        <h3 className="sheet-section-title">Notas libres</h3>
        <textarea
          className="sheet-input min-h-48"
          placeholder="Notas, homebrew, rasgos de campaña…"
          value={character.notes}
          onChange={(e) => onChange({ ...character, notes: e.target.value })}
        />
      </section>
    </div>
  );
}
