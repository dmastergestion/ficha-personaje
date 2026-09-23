import { ExpertiseForm } from "@/pages/character-new/ExpertiseForm";
import { Seccion } from "@/pages/character-new/Seccion";
import { opcionesSinDuplicar } from "@/rules/choice-uniqueness";
import {
  cantidadPericiasClase,
  clavePericiaClase,
  etiquetaPericiaClase,
  opcionesPericiaClase,
  periciasClaseDesdeElecciones,
} from "@/rules/class-skills";
import type { SkillKey } from "@/lib/constants";
import type { DatosAsistente } from "@/rules/creation";
import type { OriginChoices } from "@/rules/origin-choices";

export function PericiasClaseForm({
  datos,
  originChoices,
  skillsOrigen,
  actualizar,
}: {
  datos: DatosAsistente;
  originChoices: OriginChoices;
  skillsOrigen: SkillKey[];
  actualizar: (partial: Partial<DatosAsistente>) => void;
}) {
  const n = cantidadPericiasClase(datos.classId);
  if (n <= 0) return null;

  return (
    <Seccion
      titulo={`Pericias de clase (${n})`}
      hint="Después del trasfondo, para no repetir una pericia que ya tienes."
    >
      {Array.from({ length: n }, (_, i) => {
        const key = clavePericiaClase(i);
        const raw = originChoices.class[key] ?? "";
        const valor = skillsOrigen.includes(raw as SkillKey) ? "" : raw;
        const ocupadas = [
          ...skillsOrigen,
          ...periciasClaseDesdeElecciones(datos.classId, originChoices.class),
        ];
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
      <ExpertiseForm
        datos={datos}
        originChoices={originChoices}
        skillsOrigen={skillsOrigen}
        actualizar={actualizar}
      />
    </Seccion>
  );
}
