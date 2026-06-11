import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OriginChoicesForm } from "@/components/OriginChoicesForm";
import { OriginSidePanel } from "@/components/OriginSidePanel";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import { Button, Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { guardarPersonaje } from "@/db/repository";
import { ABILITY_LABELS_ES, SKILL_LABELS_ES } from "@/rules/character";
import {
  ARRAY_ESTANDAR,
  asignarArrayEstandar,
  asignarArrayEstandarManual,
  asignarTiradas4d6,
  crearPersonajeDesdeAsistente,
  type DatosAsistente,
} from "@/rules/creation";
import {
  aplicarBonificadoresAtributo,
  calcularBeneficiosOrigen,
  origenCatalogoDesdeIds,
} from "@/rules/origin-benefits";
import {
  eleccionesOrigenCompletas,
  fusionarEleccionesOrigen,
  resumenEleccionesOrigen,
} from "@/rules/origin-choices";
import { pvMaximoPersonaje } from "@/rules/resources";
import { modificadorAtributo } from "@/rules/ability";
import type { Tirada4d6 } from "@/rules/dice";
import { tirarSeisAtributos4d6 } from "@/rules/dice";
import {
  obtenerClase,
} from "@/rules/srd";
import { useCatalogStore } from "@/stores/catalog-store";

const PASOS = [
  { id: 0, titulo: "Identidad" },
  { id: 1, titulo: "Origen" },
  { id: 2, titulo: "Clase" },
  { id: 3, titulo: "Atributos" },
  { id: 4, titulo: "Resumen" },
] as const;

const ABILITIES_DEFAULT = Object.fromEntries(
  ABILITY_KEYS.map((k) => [k, 10]),
) as Record<AbilityKey, number>;

export function CharacterNewPage() {
  const navigate = useNavigate();
  const catalog = useCatalogStore((s) => s.catalog);
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [tiradas4d6, setTiradas4d6] = useState<Tirada4d6[] | null>(null);
  const [asignacion4d6, setAsignacion4d6] = useState<Partial<Record<AbilityKey, number>>>({});
  const [asignacionArray, setAsignacionArray] = useState<Partial<Record<AbilityKey, number>>>({});
  const [modoAtributos, setModoAtributos] = useState<"manual" | "4d6" | "array">("manual");
  const [datos, setDatos] = useState<DatosAsistente>(() => ({
    name: "",
    playerName: "",
    speciesId: catalog.species[0]?.id ?? null,
    backgroundId: null,
    classId: catalog.classes[0]?.id ?? "fighter",
    subclassId: null,
    level: 1,
    abilities: { ...ABILITIES_DEFAULT },
  }));

  const subclasesFiltradas = useMemo(
    () => catalog.subclasses.filter((sc) => sc.classId === datos.classId),
    [catalog.subclasses, datos.classId],
  );

  const catalogoOrigen = useMemo(
    () =>
      origenCatalogoDesdeIds(
        datos.speciesId,
        datos.backgroundId,
        catalog.obtenerEspecie.bind(catalog),
        catalog.obtenerTrasfondo.bind(catalog),
      ),
    [catalog, datos.speciesId, datos.backgroundId],
  );

  const originChoices = useMemo(
    () =>
      fusionarEleccionesOrigen(
        datos.speciesId,
        datos.backgroundId,
        datos.originChoices,
        catalogoOrigen,
      ),
    [datos.speciesId, datos.backgroundId, datos.originChoices, catalogoOrigen],
  );

  const beneficiosOrigen = useMemo(
    () =>
      calcularBeneficiosOrigen(
        datos.speciesId,
        datos.backgroundId,
        datos.level,
        catalogoOrigen,
        originChoices,
      ),
    [datos.speciesId, datos.backgroundId, datos.level, catalogoOrigen, originChoices],
  );

  const atributosFinales = useMemo(
    () => aplicarBonificadoresAtributo(datos.abilities, beneficiosOrigen.abilityBonuses),
    [datos.abilities, beneficiosOrigen.abilityBonuses],
  );

  function actualizar(partial: Partial<DatosAsistente>) {
    setDatos((prev) => ({ ...prev, ...partial }));
  }

  function tirarAtributos4d6() {
    const tiradas = tirarSeisAtributos4d6();
    setModoAtributos("4d6");
    setTiradas4d6(tiradas);
    setAsignacion4d6({});
    setAsignacionArray({});
  }

  function asignarTiradaAtributo(key: AbilityKey, index: number | null) {
    const next = { ...asignacion4d6 };
    if (index === null) {
      delete next[key];
    } else {
      for (const other of ABILITY_KEYS) {
        if (other !== key && next[other] === index) delete next[other];
      }
      next[key] = index;
    }
    setAsignacion4d6(next);
    const abilities = asignarTiradas4d6(tiradas4d6 ?? [], next);
    if (abilities) actualizar({ abilities });
  }

  function usarArrayEstandar() {
    setModoAtributos("array");
    setTiradas4d6(null);
    setAsignacion4d6({});
    setAsignacionArray({});
    actualizar({
      abilities: Object.fromEntries(ABILITY_KEYS.map((k) => [k, 10])) as Record<
        AbilityKey,
        number
      >,
    });
  }

  function asignarValorArray(key: AbilityKey, index: number | null) {
    const next = { ...asignacionArray };
    if (index === null) {
      delete next[key];
    } else {
      for (const other of ABILITY_KEYS) {
        if (other !== key && next[other] === index) delete next[other];
      }
      next[key] = index;
    }
    setAsignacionArray(next);
    const abilities = asignarArrayEstandarManual(next);
    if (abilities) actualizar({ abilities });
  }

  function aplicarArrayAutomatico() {
    setModoAtributos("array");
    setTiradas4d6(null);
    setAsignacion4d6({});
    setAsignacionArray({});
    actualizar({ abilities: asignarArrayEstandar(datos.classId) });
  }

  function validarPasoActual(): string | null {
    if (paso === 0 && !datos.name.trim()) return "El nombre del personaje es obligatorio.";
    if (paso === 1 && !datos.speciesId) return "Elige una especie.";
    if (
      paso === 1 &&
      !eleccionesOrigenCompletas(
        datos.speciesId,
        datos.backgroundId,
        originChoices,
        catalogoOrigen,
      )
    ) {
      return "Completa las elecciones de especie y trasfondo.";
    }
    if (paso === 2 && !datos.classId) return "Elige una clase.";
    return null;
  }

  function siguiente() {
    const msg = validarPasoActual();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(PASOS.length - 1, p + 1));
  }

  function anterior() {
    setError(null);
    setPaso((p) => Math.max(0, p - 1));
  }

  async function crear() {
    const msg = validarPasoActual();
    if (msg) {
      setError(msg);
      return;
    }
    setCreando(true);
    setError(null);
    try {
      const character = crearPersonajeDesdeAsistente(
        { ...datos, originChoices },
        catalogoOrigen,
      );
      await guardarPersonaje(character);
      navigate(`/character/${character.id}`);
    } catch (err) {
      console.error("No se pudo crear la ficha", err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el personaje en este dispositivo.",
      );
    } finally {
      setCreando(false);
    }
  }

  const muestraPanelLateral = paso === 1 || paso === 2;

  return (
    <Layout title="Nuevo personaje" wide={muestraPanelLateral}>
      <nav className="mb-6 flex flex-wrap gap-2">
        {PASOS.map((p, index) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              index === paso && "bg-gold font-semibold text-black",
              index < paso && "border border-gold/40 text-gold",
              index > paso && "border border-white/10 text-muted",
            )}
          >
            <span>{index + 1}</span>
            <span>{p.titulo}</span>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "mx-auto rounded-xl border border-white/10 bg-panel p-6",
          muestraPanelLateral ? "grid max-w-5xl gap-6 lg:grid-cols-[1fr,18rem]" : "max-w-xl",
        )}
      >
        <div className="min-w-0">
        {paso === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">¿Cómo se llama tu personaje?</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Nombre del personaje</span>
              <input
                autoFocus
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.name}
                onChange={(e) => actualizar({ name: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Nombre del jugador</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.playerName}
                onChange={(e) => actualizar({ playerName: e.target.value })}
              />
            </label>
          </div>
        )}

        {paso === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Origen</h2>
            <SpeciesPicker
              catalog={catalog}
              speciesId={datos.speciesId}
              onChange={(speciesId) => actualizar({ speciesId })}
            />
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Trasfondo</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.backgroundId ?? ""}
                onChange={(e) => actualizar({ backgroundId: e.target.value || null })}
              >
                <option value="">— Elegir después —</option>
                {catalog.backgrounds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {catalog.t("backgrounds", b.id, b.nameEn)}
                  </option>
                ))}
              </select>
            </label>

            <OriginChoicesForm
              speciesId={datos.speciesId}
              backgroundId={datos.backgroundId}
              level={datos.level}
              catalogo={catalogoOrigen}
              choices={originChoices}
              onChange={(next) => actualizar({ originChoices: next })}
              mode="create"
            />
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Clase y nivel</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Clase</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.classId}
                onChange={(e) =>
                  actualizar({
                    classId: e.target.value,
                    subclassId: null,
                    abilities: asignarArrayEstandar(e.target.value),
                  })
                }
              >
                {catalog.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {catalog.t("classes", c.id, c.nameEn)}
                  </option>
                ))}
              </select>
            </label>
            {subclasesFiltradas.length > 0 && (
              <label className="block space-y-1 text-sm">
                <span className="text-muted">Subclase (niv. 3 en juego; opcional al crear)</span>
                <select
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={datos.subclassId ?? ""}
                  onChange={(e) => actualizar({ subclassId: e.target.value || null })}
                >
                  <option value="">— Elegir después —</option>
                  {subclasesFiltradas.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {catalog.t("subclasses", sc.id, sc.nameEn)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Nivel inicial</span>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.level}
                onChange={(e) =>
                  actualizar({
                    level: Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
              />
            </label>
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Atributos</h2>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="critical" onClick={tirarAtributos4d6}>
                  Tirar 4d6
                </Button>
                <Button type="button" onClick={usarArrayEstandar}>
                  Array estándar
                </Button>
                <Button type="button" variant="ghost" onClick={aplicarArrayAutomatico}>
                  Auto por clase
                </Button>
              </div>
            </div>

            {modoAtributos === "array" ? (
              <>
                <p className="text-sm text-muted">
                  Asigna cada valor del array estándar (15, 14, 13, 12, 10, 8) a un atributo.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ARRAY_ESTANDAR.map((valor, index) => {
                    const usado = Object.values(asignacionArray).includes(index);
                    return (
                      <span
                        key={index}
                        className={cn(
                          "rounded-lg border px-3 py-1 text-sm",
                          usado
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : "border-white/10 bg-surface text-muted",
                        )}
                      >
                        {valor}
                      </span>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ABILITY_KEYS.map((key) => {
                    const mod = modificadorAtributo(datos.abilities[key]);
                    return (
                      <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                        <span className="text-muted">{ABILITY_LABELS_ES[key]}</span>
                        <select
                          className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
                          value={asignacionArray[key] ?? ""}
                          onChange={(e) =>
                            asignarValorArray(
                              key,
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        >
                          <option value="">— Elegir valor —</option>
                          {ARRAY_ESTANDAR.map((valor, index) => (
                            <option key={index} value={index}>
                              {valor}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted">
                          Valor {datos.abilities[key]} · Mod {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : tiradas4d6 ? (
              <>
                <p className="text-sm text-muted">
                  Seis tiradas de 4d6 (se descarta el más bajo). Asigna cada resultado a un
                  atributo.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tiradas4d6.map((tirada, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
                    >
                      <div className="font-semibold">Tirada {index + 1}: {tirada.total}</div>
                      <div className="text-xs text-muted">
                        {tirada.dice.join(", ")} · descarta {tirada.dropped}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ABILITY_KEYS.map((key) => {
                    const mod = modificadorAtributo(datos.abilities[key]);
                    return (
                      <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                        <span className="text-muted">{ABILITY_LABELS_ES[key]}</span>
                        <select
                          className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
                          value={asignacion4d6[key] ?? ""}
                          onChange={(e) =>
                            asignarTiradaAtributo(
                              key,
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        >
                          <option value="">— Elegir tirada —</option>
                          {tiradas4d6.map((tirada, index) => (
                            <option key={index} value={index}>
                              Tirada {index + 1}: {tirada.total}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted">
                          Valor {datos.abilities[key]} · Mod {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  Pulsa «Tirar 4d6» para generar atributos, o «Array estándar» (15, 14, 13, 12, 10,
                  8). También puedes ajustar manualmente.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ABILITY_KEYS.map((key) => {
                    const mod = modificadorAtributo(datos.abilities[key]);
                    return (
                      <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                        <span className="text-muted">{ABILITY_LABELS_ES[key]}</span>
                        <input
                          type="number"
                          min={3}
                          max={30}
                          className="mt-1 w-full bg-transparent text-lg font-semibold outline-none"
                          value={datos.abilities[key]}
                          onChange={(e) => {
                            setModoAtributos("manual");
                            actualizar({
                              abilities: {
                                ...datos.abilities,
                                [key]: Math.min(30, Math.max(3, Number(e.target.value) || 10)),
                              },
                            });
                          }}
                        />
                        <span className="text-xs text-muted">
                          Mod {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Resumen</h2>
            <p>
              <strong>{datos.name}</strong> · {datos.playerName || "Sin jugador"}
            </p>
            <p>
              {catalog.t("species", datos.speciesId, "—")} ·{" "}
              {catalog.t("classes", datos.classId, datos.classId)} · Nivel {datos.level}
            </p>
            {datos.backgroundId && (
              <p>Trasfondo: {catalog.t("backgrounds", datos.backgroundId, datos.backgroundId)}</p>
            )}
            {datos.subclassId && (
              <p>Subclase: {catalog.t("subclasses", datos.subclassId, datos.subclassId)}</p>
            )}
            <p>
              PV estimados:{" "}
              {pvMaximoPersonaje(
                obtenerClase(datos.classId)?.hitDie ?? "d8",
                atributosFinales.con,
                datos.level,
              ) + beneficiosOrigen.hpBonusTotal}
            </p>
            {beneficiosOrigen.skills.length > 0 && (
              <p className="text-muted">
                Pericias de origen:{" "}
                {beneficiosOrigen.skills.map((s) => SKILL_LABELS_ES[s]).join(", ")}
              </p>
            )}
            {beneficiosOrigen.toolProficiencies.length > 0 && (
              <p className="text-muted">
                Herramientas: {beneficiosOrigen.toolProficiencies.join(", ")}
              </p>
            )}
            {beneficiosOrigen.feat && (
              <p className="text-muted">Dote de trasfondo: {beneficiosOrigen.feat.name}</p>
            )}
            {resumenEleccionesOrigen(
              datos.speciesId,
              datos.backgroundId,
              originChoices,
              catalogoOrigen,
            ).map((linea) => (
              <p key={linea} className="text-muted">
                {linea}
              </p>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              {ABILITY_KEYS.map((key) => {
                const bonus = beneficiosOrigen.abilityBonuses[key] ?? 0;
                return (
                  <span key={key} className="rounded bg-surface px-2 py-1">
                    {ABILITY_LABELS_ES[key].slice(0, 3).toUpperCase()} {atributosFinales[key]}
                    {bonus > 0 && <span className="text-gold"> (+{bonus})</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-between gap-2">
          <Button type="button" variant="ghost" disabled={paso === 0} onClick={anterior}>
            Anterior
          </Button>
          {paso < PASOS.length - 1 ? (
            <Button type="button" variant="critical" onClick={siguiente}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="critical"
              disabled={creando}
              onClick={() => void crear()}
            >
              {creando ? "Guardando…" : "Crear ficha"}
            </Button>
          )}
        </div>
        </div>

        {muestraPanelLateral && (
          <OriginSidePanel
            catalog={catalog}
            speciesId={datos.speciesId}
            backgroundId={datos.backgroundId}
            level={datos.level}
            classId={paso >= 2 ? datos.classId : undefined}
            subclassId={paso >= 2 ? datos.subclassId : undefined}
            classes={
              paso >= 2
                ? [{ classId: datos.classId, subclassId: datos.subclassId, level: datos.level }]
                : undefined
            }
          />
        )}
      </div>
    </Layout>
  );
}
