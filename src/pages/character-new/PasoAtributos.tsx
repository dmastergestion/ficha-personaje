import { OriginAbilityBonusForm } from "@/components/OriginAbilityBonusForm";
import { Button } from "@/components/layout";
import { MejorasNivelForm } from "@/pages/character-new/MejorasNivelForm";
import { cn } from "@/lib/utils";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_LABELS_ES, abreviaturaAtributo } from "@/rules/character";
import {
  ARRAY_ESTANDAR,
  COSTES_POINT_BUY,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  PRESUPUESTO_POINT_BUY,
  indicesLibresAsignacion,
  puntosGastadosPointBuy,
  type DatosAsistente,
} from "@/rules/creation";
import type { OrigenCatalogo } from "@/rules/origin-benefits";
import type { OriginChoices } from "@/rules/origin-choices";
import type { Tirada4d6 } from "@/rules/dice";
import type { ModoAtributos } from "@/pages/character-new/types";

export function PasoAtributos({
  datos,
  actualizar,
  catalogoOrigen,
  originChoices,
  modoAtributos,
  tiradas4d6,
  asignacion4d6,
  asignacionArray,
  textoAtributo,
  tirarAtributos4d6,
  asignarTiradaAtributo,
  usarArrayEstandar,
  usarPointBuy,
  asignarValorArray,
  atributosPrincipales,
}: {
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
  catalogoOrigen: OrigenCatalogo;
  originChoices: OriginChoices;
  modoAtributos: ModoAtributos;
  setModoAtributos: (modo: ModoAtributos) => void;
  tiradas4d6: Tirada4d6[] | null;
  asignacion4d6: Partial<Record<AbilityKey, number>>;
  asignacionArray: Partial<Record<AbilityKey, number>>;
  textoAtributo: (key: AbilityKey) => string;
  tirarAtributos4d6: () => void;
  asignarTiradaAtributo: (key: AbilityKey, index: number | null) => void;
  usarArrayEstandar: () => void;
  usarPointBuy: () => void;
  asignarValorArray: (key: AbilityKey, index: number | null) => void;
  atributosPrincipales: AbilityKey[];
}) {
  const primarios = new Set(atributosPrincipales);
  const etiquetaCampo = (key: AbilityKey) => (
    <span className={cn(primarios.has(key) && "text-accent")}>
      {ABILITY_LABELS_ES[key]}
      {primarios.has(key) ? " · principal" : ""}
    </span>
  );
  const hintPrincipales =
    atributosPrincipales.length > 0
      ? `Pon el valor más alto en ${atributosPrincipales.map(abreviaturaAtributo).join(" / ")}.`
      : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Atributos</h2>
          <p className="text-sm text-muted">
            Elige un método del PHB 2024. Luego reparte el +2/+1 del trasfondo.
            {hintPrincipales ? ` ${hintPrincipales}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={modoAtributos === "4d6" ? "primary" : "combat"}
            onClick={tirarAtributos4d6}
          >
            Tirar 4d6
          </Button>
          <Button
            type="button"
            variant={modoAtributos === "array" ? "primary" : "default"}
            onClick={usarArrayEstandar}
          >
            Array estándar
          </Button>
          <Button
            type="button"
            variant={modoAtributos === "pointBuy" ? "primary" : "default"}
            onClick={usarPointBuy}
          >
            Compra de puntos (27)
          </Button>
        </div>
      </div>

      {modoAtributos === "sinElegir" && (
        <p className="rounded-lg border border-white/10 bg-surface/50 px-3 py-2 text-sm text-muted">
          No se avanza con 10 en todo: tira 4d6, usa el array 15–8 o gasta 27 puntos.
        </p>
      )}

      {modoAtributos === "pointBuy" ? (
        <>
          <p className="text-sm text-muted">
            Presupuesto 27. Cada atributo entre 8 y 15 (8=0, 14=7, 15=9). Gastados:{" "}
            {puntosGastadosPointBuy(datos.abilities)}/{PRESUPUESTO_POINT_BUY}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ABILITY_KEYS.map((key) => (
              <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                {etiquetaCampo(key)}
                <select
                  className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
                  value={datos.abilities[key]}
                  onChange={(e) =>
                    actualizar({
                      abilities: {
                        ...datos.abilities,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                >
                  {Array.from(
                    { length: POINT_BUY_MAX - POINT_BUY_MIN + 1 },
                    (_, i) => POINT_BUY_MIN + i,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} ({COSTES_POINT_BUY[n]} pts)
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">{textoAtributo(key)}</span>
              </label>
            ))}
          </div>
        </>
      ) : modoAtributos === "array" ? (
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
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/10 bg-surface text-muted",
                  )}
                >
                  {valor}
                </span>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ABILITY_KEYS.map((key) => (
              <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                {etiquetaCampo(key)}
                <select
                  className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
                  value={asignacionArray[key] ?? ""}
                  onChange={(e) =>
                    asignarValorArray(key, e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">— Elegir valor —</option>
                  {indicesLibresAsignacion(asignacionArray, key, ARRAY_ESTANDAR.length).map(
                    (index) => (
                      <option key={index} value={index}>
                        {ARRAY_ESTANDAR[index]}
                      </option>
                    ),
                  )}
                </select>
                <span className="text-xs text-muted">{textoAtributo(key)}</span>
              </label>
            ))}
          </div>
        </>
      ) : modoAtributos === "4d6" && tiradas4d6 ? (
        <>
          <p className="text-sm text-muted">
            Seis tiradas de 4d6 (se descarta el más bajo). Asigna cada resultado a un atributo.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {tiradas4d6.map((tirada, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
              >
                <div className="font-semibold">
                  Tirada {index + 1}: {tirada.total}
                </div>
                <div className="text-xs text-muted">
                  {tirada.dice.join(", ")} · descarta {tirada.dropped}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ABILITY_KEYS.map((key) => (
              <label key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
                {etiquetaCampo(key)}
                <select
                  className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
                  value={asignacion4d6[key] ?? ""}
                  onChange={(e) =>
                    asignarTiradaAtributo(key, e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">— Elegir tirada —</option>
                  {indicesLibresAsignacion(asignacion4d6, key, tiradas4d6.length).map((index) => (
                    <option key={index} value={index}>
                      Tirada {index + 1}: {tiradas4d6[index]!.total}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">{textoAtributo(key)}</span>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {modoAtributos !== "sinElegir" && (
        <>
          <OriginAbilityBonusForm
            backgroundId={datos.backgroundId}
            catalogo={catalogoOrigen}
            choices={originChoices}
            onChange={(next) => actualizar({ originChoices: next })}
          />
          <MejorasNivelForm datos={datos} actualizar={actualizar} />
        </>
      )}
    </div>
  );
}
