import { ClassChoicesForm } from "@/components/ClassChoicesForm";
import { WeaponMasteryPanel } from "@/components/WeaponMasteryPanel";
import { cn } from "@/lib/utils";
import { Seccion } from "@/pages/character-new/Seccion";
import { abreviaturaAtributo } from "@/rules/character";
import { nivelSubclase } from "@/rules/class-features";
import { claseConcedeEstiloCombate } from "@/rules/feat-mechanics";
import { dotesEstiloCombate } from "@/rules/feat-text";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import type { OriginChoiceDefinition, OriginChoices } from "@/rules/origin-choices";
import type { Character, ClassLevel } from "@/schemas/character";
import { atributosPrincipalesClase } from "@/rules/srd";
import { claseTieneMaestriaArmas } from "@/rules/weapon-mastery";

export function PasoClase({
  catalog,
  datos,
  actualizar,
  originChoices,
  subclasesFiltradas,
  clasesConjuro,
  eleccionEquipoClase,
  resumenEquipoClaseActual,
  borradorMaestrias,
  spellSelectionCantrips,
}: {
  catalog: GameCatalog;
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
  originChoices: OriginChoices;
  subclasesFiltradas: GameCatalog["subclasses"];
  clasesConjuro: ClassLevel[];
  eleccionEquipoClase: OriginChoiceDefinition | undefined;
  resumenEquipoClaseActual: string[];
  borradorMaestrias: Character;
  spellSelectionCantrips: string[];
}) {
  const claseElegida = Boolean(datos.classId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Clase y nivel</h2>
        <p className="text-sm text-muted">
          Elige vocación. El atributo principal te indica qué trasfondo y puntuaciones te irán
          mejor.
        </p>
      </div>

      <Seccion titulo="Clase">
        <div className="grid grid-cols-2 gap-2">
          {catalog.classes.map((c) => {
            const activa = datos.classId === c.id;
            const principales = atributosPrincipalesClase(c.id)
              .map((key) => abreviaturaAtributo(key))
              .join(" / ");
            return (
              <button
                key={c.id}
                type="button"
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition",
                  activa
                    ? "border-accent bg-accent/15 font-semibold text-cream"
                    : "border-white/10 bg-surface hover:border-white/25",
                )}
                onClick={() => {
                  if (datos.classId === c.id) return;
                  actualizar({ classId: c.id, subclassId: null });
                }}
              >
                <span className="block">{catalog.t("classes", c.id, c.nameEn)}</span>
                <span className="text-xs text-muted">
                  {principales}
                  {c.hitDie ? ` · ${c.hitDie}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </Seccion>

      {claseElegida && (
        <>
          <Seccion
            titulo="Nivel inicial"
            hint={
              datos.level > 1
                ? "Por encima de 1 aparecen subclase, ASI, expertise y más elecciones más adelante."
                : undefined
            }
          >
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Nivel</span>
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
            {subclasesFiltradas.length > 0 && (
              <label className="block space-y-1 text-sm">
                <span className="text-muted">
                  Subclase
                  {datos.level >= nivelSubclase(datos.classId ?? "")
                    ? " (obligatoria)"
                    : " (opcional)"}
                </span>
                <select
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={datos.subclassId ?? ""}
                  onChange={(e) => actualizar({ subclassId: e.target.value || null })}
                >
                  <option value="">
                    {datos.level >= nivelSubclase(datos.classId ?? "")
                      ? "— Elige subclase —"
                      : "— Elegir después —"}
                  </option>
                  {subclasesFiltradas.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {catalog.t("subclasses", sc.id, sc.nameEn)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </Seccion>

          {eleccionEquipoClase && (
            <Seccion
              titulo="Equipo inicial"
              hint="A y B son paquetes; C suele ser solo oro. El listado de abajo es lo que entra en la ficha."
            >
              <label className="block space-y-1 text-sm">
                <span className="text-muted">{eleccionEquipoClase.label}</span>
                <select
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={originChoices.class.equipment ?? ""}
                  onChange={(e) =>
                    actualizar({
                      originChoices: {
                        species: datos.originChoices?.species ?? {},
                        background: datos.originChoices?.background ?? {},
                        class: {
                          ...(datos.originChoices?.class ?? {}),
                          equipment: e.target.value,
                        },
                      },
                    })
                  }
                >
                  <option value="">— Elige paquete —</option>
                  {eleccionEquipoClase.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {resumenEquipoClaseActual.length > 0 && (
                <ul className="list-inside list-disc text-sm text-muted">
                  {resumenEquipoClaseActual.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </Seccion>
          )}

          {claseTieneMaestriaArmas(datos.classId) && (
            <Seccion titulo="Maestría con armas">
              <WeaponMasteryPanel
                character={borradorMaestrias}
                compact
                onChange={(next) => actualizar({ weaponMasteries: next.weaponMasteries })}
              />
            </Seccion>
          )}

          <ClassChoicesForm
            classId={datos.classId ?? ""}
            classes={clasesConjuro}
            level={datos.level}
            choices={originChoices}
            catalog={catalog}
            mode="create"
            omitirEquipo
            trucosConocidos={spellSelectionCantrips}
            onChange={(next) => actualizar({ originChoices: next })}
          />

          {claseConcedeEstiloCombate(datos.classId ?? "", datos.level) && (
            <Seccion titulo="Estilo de combate" hint="Obligatorio. No se asigna el primero de la lista.">
              <label className="block space-y-1 text-sm">
                <span className="text-muted">Estilo</span>
                <select
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={datos.fightingStyleFeatId ?? ""}
                  onChange={(e) => actualizar({ fightingStyleFeatId: e.target.value || null })}
                >
                  <option value="">— Elige estilo —</option>
                  {dotesEstiloCombate().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </Seccion>
          )}
        </>
      )}
    </div>
  );
}
