import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_KEYS } from "@/lib/constants";
import { guardarPersonaje } from "@/db/repository";
import { ABILITY_LABELS_ES } from "@/rules/character";
import {
  asignarArrayEstandar,
  crearPersonajeDesdeAsistente,
  pvMaximoNivel1,
  type DatosAsistente,
} from "@/rules/creation";
import { modificadorAtributo } from "@/rules/ability";
import {
  obtenerClase,
  srdBackgrounds,
  srdClasses,
  srdSpecies,
  srdSubclasses,
  t,
} from "@/rules/srd";

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
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosAsistente>({
    name: "",
    playerName: "",
    speciesId: srdSpecies[0]?.id ?? null,
    backgroundId: null,
    classId: srdClasses[0]?.id ?? "fighter",
    subclassId: null,
    level: 1,
    abilities: { ...ABILITIES_DEFAULT },
  });

  const subclasesFiltradas = useMemo(
    () => srdSubclasses.filter((sc) => sc.classId === datos.classId),
    [datos.classId],
  );

  function actualizar(partial: Partial<DatosAsistente>) {
    setDatos((prev) => ({ ...prev, ...partial }));
  }

  function validarPasoActual(): string | null {
    if (paso === 0 && !datos.name.trim()) return "El nombre del personaje es obligatorio.";
    if (paso === 1 && !datos.speciesId) return "Elige una especie.";
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
    const character = crearPersonajeDesdeAsistente(datos);
    await guardarPersonaje(character);
    navigate(`/character/${character.id}`);
  }

  return (
    <Layout title="Nuevo personaje">
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

      <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-panel p-6">
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
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Especie</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.speciesId ?? ""}
                onChange={(e) => actualizar({ speciesId: e.target.value || null })}
              >
                {srdSpecies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t("species", s.id, s.nameEn)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Trasfondo</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={datos.backgroundId ?? ""}
                onChange={(e) => actualizar({ backgroundId: e.target.value || null })}
              >
                <option value="">— Elegir después —</option>
                {srdBackgrounds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {t("backgrounds", b.id, b.nameEn)}
                  </option>
                ))}
              </select>
            </label>
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
                {srdClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t("classes", c.id, c.nameEn)}
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
                      {t("subclasses", sc.id, sc.nameEn)}
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
              <Button
                type="button"
                onClick={() => actualizar({ abilities: asignarArrayEstandar(datos.classId) })}
              >
                Array estándar
              </Button>
            </div>
            <p className="text-sm text-muted">
              Array estándar: 15, 14, 13, 12, 10, 8 — asignado según tu clase. Puedes ajustar
              manualmente.
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
                      onChange={(e) =>
                        actualizar({
                          abilities: {
                            ...datos.abilities,
                            [key]: Math.min(30, Math.max(3, Number(e.target.value) || 10)),
                          },
                        })
                      }
                    />
                    <span className="text-xs text-muted">
                      Mod {mod >= 0 ? `+${mod}` : mod}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-semibold">Resumen</h2>
            <p>
              <strong>{datos.name}</strong> · {datos.playerName || "Sin jugador"}
            </p>
            <p>
              {t("species", datos.speciesId, "—")} ·{" "}
              {t("classes", datos.classId, datos.classId)} · Nivel {datos.level}
            </p>
            {datos.backgroundId && (
              <p>Trasfondo: {t("backgrounds", datos.backgroundId, datos.backgroundId)}</p>
            )}
            {datos.subclassId && (
              <p>Subclase: {t("subclasses", datos.subclassId, datos.subclassId)}</p>
            )}
            <p>
              PV estimados:{" "}
              {pvMaximoNivel1(
                obtenerClase(datos.classId)?.hitDie ?? "d8",
                datos.abilities.con,
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {ABILITY_KEYS.map((key) => (
                <span key={key} className="rounded bg-surface px-2 py-1">
                  {ABILITY_LABELS_ES[key].slice(0, 3).toUpperCase()} {datos.abilities[key]}
                </span>
              ))}
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
            <Button type="button" variant="critical" onClick={() => void crear()}>
              Crear ficha
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
