import { ClassChoicesForm } from "@/components/ClassChoicesForm";
import { WeaponMasteryPanel } from "@/components/WeaponMasteryPanel";
import { opcionesSinDuplicar } from "@/rules/choice-uniqueness";
import {
  cantidadPericiasClase,
  clavePericiaClase,
  etiquetaPericiaClase,
  opcionesPericiaClase,
  periciasClaseDesdeElecciones,
} from "@/rules/class-skills";
import { nivelSubclase } from "@/rules/class-features";
import { claseConcedeEstiloCombate } from "@/rules/feat-mechanics";
import { dotesEstiloCombate } from "@/rules/feat-text";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import type { OriginChoiceDefinition, OriginChoices } from "@/rules/origin-choices";
import type { Character, ClassLevel } from "@/schemas/character";
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
  return (
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
          <span className="text-muted">
            Subclase
            {datos.level >= nivelSubclase(datos.classId) ? " (obligatoria)" : " (opcional)"}
          </span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={datos.subclassId ?? ""}
            onChange={(e) => actualizar({ subclassId: e.target.value || null })}
          >
            <option value="">
              {datos.level >= nivelSubclase(datos.classId)
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
      {cantidadPericiasClase(datos.classId) > 0 && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-surface/50 p-3">
          <p className="text-sm font-medium">
            Pericias de clase ({cantidadPericiasClase(datos.classId)})
          </p>
          {Array.from({ length: cantidadPericiasClase(datos.classId) }, (_, i) => {
            const key = clavePericiaClase(i);
            const valor = originChoices.class[key] ?? "";
            const ocupadas = periciasClaseDesdeElecciones(datos.classId, originChoices.class);
            const options = opcionesSinDuplicar(
              opcionesPericiaClase(datos.classId).map((skill) => ({
                value: skill,
                label: etiquetaPericiaClase(skill),
              })),
              ocupadas,
              valor,
            );
            return (
              <label key={key} className="block space-y-1 text-sm">
                <span className="text-muted">Pericia {i + 1}</span>
                <select
                  className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={valor}
                  onChange={(e) =>
                    actualizar({
                      originChoices: {
                        species: originChoices.species,
                        background: originChoices.background,
                        class: { ...originChoices.class, [key]: e.target.value },
                      },
                    })
                  }
                >
                  <option value="">— Elegir —</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      )}
      {eleccionEquipoClase && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-surface/50 p-3">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{eleccionEquipoClase.label}</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
              value={originChoices.class.equipment ?? "A"}
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
        </div>
      )}
      {claseTieneMaestriaArmas(datos.classId) && (
        <WeaponMasteryPanel
          character={borradorMaestrias}
          compact
          onChange={(next) => actualizar({ weaponMasteries: next.weaponMasteries })}
        />
      )}
      <ClassChoicesForm
        classId={datos.classId}
        classes={clasesConjuro}
        level={datos.level}
        choices={originChoices}
        catalog={catalog}
        mode="create"
        omitirEquipo
        trucosConocidos={spellSelectionCantrips}
        onChange={(next) => actualizar({ originChoices: next })}
      />
      {claseConcedeEstiloCombate(datos.classId, datos.level) && (
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Estilo de combate (obligatorio)</span>
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
      )}
    </div>
  );
}
