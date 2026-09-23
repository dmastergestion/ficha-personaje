import type { SkillKey } from "@/lib/constants";
import { SKILL_LABELS_ES } from "@/rules/character";
import { cantidadExpertiseHastaNivel } from "@/rules/class-features";
import { periciasClaseDesdeElecciones } from "@/rules/class-skills";
import type { DatosAsistente } from "@/rules/creation";
import type { OriginChoices } from "@/rules/origin-choices";

export function ExpertiseForm({
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
  const max = cantidadExpertiseHastaNivel(datos.classId, datos.level);
  if (max <= 0) return null;

  const disponibles = [
    ...new Set([...skillsOrigen, ...periciasClaseDesdeElecciones(datos.classId, originChoices.class)]),
  ] as SkillKey[];

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-surface/50 p-3">
      <div>
        <p className="text-sm font-medium">Expertise ({max} pericias)</p>
        <p className="text-xs text-muted">
          Elige entre las pericias que ya tienes (origen + clase). {datos.expertise?.length ?? 0}/
          {max}.
        </p>
      </div>
      {disponibles.length === 0 ? (
        <p className="text-xs text-amber-200">Primero elige las pericias de clase.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {disponibles.map((skill) => {
            const expertise = datos.expertise ?? [];
            return (
              <li key={skill}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={expertise.includes(skill)}
                    onChange={() => {
                      const has = expertise.includes(skill);
                      if (has) {
                        actualizar({ expertise: expertise.filter((s) => s !== skill) });
                        return;
                      }
                      if (expertise.length >= max) return;
                      actualizar({ expertise: [...expertise, skill] });
                    }}
                  />
                  {SKILL_LABELS_ES[skill]}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
