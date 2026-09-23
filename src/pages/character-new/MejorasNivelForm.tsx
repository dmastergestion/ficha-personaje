import { Button } from "@/components/layout";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_LABELS_ES } from "@/rules/character";
import { cantidadMejorasAtributosHastaNivel } from "@/rules/class-features";
import type { DatosAsistente } from "@/rules/creation";
import { mejorasCreacionVacias } from "@/rules/creation-wizard";
import { dotesParaMejoraAtributos } from "@/rules/feat-text";

export function MejorasNivelForm({
  datos,
  actualizar,
}: {
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
}) {
  const n = cantidadMejorasAtributosHastaNivel(datos.classId, datos.level);
  if (n <= 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div>
        <p className="text-sm font-medium">Mejoras de nivel (ASI o dote)</p>
        <p className="text-xs text-muted">
          A nivel {datos.level} toca elegir {n === 1 ? "una mejora" : `${n} mejoras`}. No las dejes
          para el resumen: aquí ves el valor final de los atributos.
        </p>
      </div>
      {mejorasCreacionVacias(n, datos.mejorasNivel).map((mejora, index) => (
        <div key={index} className="space-y-2 rounded border border-white/10 p-2">
          <p className="text-xs text-muted">Mejora {index + 1}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mejora.modo === "asi" ? "primary" : "ghost"}
              className="text-xs"
              onClick={() => {
                const list = [...(datos.mejorasNivel ?? [])];
                list[index] = { ...mejora, modo: "asi", featId: undefined };
                actualizar({ mejorasNivel: list });
              }}
            >
              ASI
            </Button>
            <Button
              type="button"
              variant={mejora.modo === "feat" ? "primary" : "ghost"}
              className="text-xs"
              onClick={() => {
                const list = [...(datos.mejorasNivel ?? [])];
                list[index] = { ...mejora, modo: "feat" };
                actualizar({ mejorasNivel: list });
              }}
            >
              Dote
            </Button>
          </div>
          {mejora.modo === "asi" ? (
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mejora.asiDos}
                  onChange={(e) => {
                    const list = [...(datos.mejorasNivel ?? [])];
                    list[index] = { ...mejora, asiDos: e.target.checked };
                    actualizar({ mejorasNivel: list });
                  }}
                />
                +1 a dos atributos (si no, +2 a uno)
              </label>
              <label className="block">
                Atributo A
                <select
                  className="mt-1 w-full rounded border border-white/10 bg-surface px-2 py-1"
                  value={mejora.asiA}
                  onChange={(e) => {
                    const list = [...(datos.mejorasNivel ?? [])];
                    list[index] = { ...mejora, asiA: e.target.value as AbilityKey };
                    actualizar({ mejorasNivel: list });
                  }}
                >
                  {ABILITY_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {ABILITY_LABELS_ES[k]}
                    </option>
                  ))}
                </select>
              </label>
              {mejora.asiDos && (
                <label className="block">
                  Atributo B
                  <select
                    className="mt-1 w-full rounded border border-white/10 bg-surface px-2 py-1"
                    value={mejora.asiB}
                    onChange={(e) => {
                      const list = [...(datos.mejorasNivel ?? [])];
                      list[index] = { ...mejora, asiB: e.target.value as AbilityKey };
                      actualizar({ mejorasNivel: list });
                    }}
                  >
                    {ABILITY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {ABILITY_LABELS_ES[k]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ) : (
            <label className="block text-xs">
              Dote
              <select
                className="mt-1 w-full rounded border border-white/10 bg-surface px-2 py-1"
                value={mejora.featId ?? ""}
                onChange={(e) => {
                  const list = [...(datos.mejorasNivel ?? [])];
                  list[index] = { ...mejora, featId: e.target.value || undefined };
                  actualizar({ mejorasNivel: list });
                }}
              >
                <option value="">— Elige dote —</option>
                {dotesParaMejoraAtributos().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
