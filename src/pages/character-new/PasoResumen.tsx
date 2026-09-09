import { Button } from "@/components/layout";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_LABELS_ES, SKILL_LABELS_ES } from "@/rules/character";
import { cantidadExpertiseHastaNivel, cantidadMejorasAtributosHastaNivel, hitosMecanicos } from "@/rules/class-features";
import { periciasClaseDesdeElecciones } from "@/rules/class-skills";
import { mejorasCreacionVacias } from "@/rules/creation-wizard";
import { dotesParaMejoraAtributos } from "@/rules/feat-text";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import type { BeneficiosOrigen, OrigenCatalogo } from "@/rules/origin-benefits";
import { resumenEleccionesOrigen, type OriginChoices } from "@/rules/origin-choices";
import { pvMaximoPersonaje } from "@/rules/resources";
import { obtenerClase } from "@/rules/srd";

export function PasoResumen({
  catalog,
  datos,
  actualizar,
  catalogoOrigen,
  originChoices,
  beneficiosOrigen,
  atributosFinales,
}: {
  catalog: GameCatalog;
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
  catalogoOrigen: OrigenCatalogo;
  originChoices: OriginChoices;
  beneficiosOrigen: BeneficiosOrigen;
  atributosFinales: Record<AbilityKey, number>;
}) {
  return (
    <div className="space-y-3 text-sm">
      <h2 className="text-lg font-semibold">Resumen</h2>
      <p>
        <strong>{datos.name}</strong> · {datos.playerName || "Sin jugador"}
      </p>
      <p>
        {catalog.t("species", datos.speciesId, "—")} ·{" "}
        {catalog.t("classes", datos.classId, datos.classId)} · Nivel {datos.level}
      </p>
      {datos.subclassId && (
        <p>Subclase: {catalog.t("subclasses", datos.subclassId, datos.subclassId)}</p>
      )}
      {datos.backgroundId && (
        <p>Trasfondo: {catalog.t("backgrounds", datos.backgroundId, datos.backgroundId)}</p>
      )}
      {cantidadMejorasAtributosHastaNivel(datos.classId, datos.level) > 0 && (
        <div className="space-y-3 rounded-lg border border-gold/30 bg-gold/5 p-3">
          <p className="font-medium text-gold">Mejoras de atributos o dotes (obligatorio para crear)</p>
          {mejorasCreacionVacias(
            cantidadMejorasAtributosHastaNivel(datos.classId, datos.level),
            datos.mejorasNivel,
          ).map((mejora, index) => (
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
      )}
      {cantidadExpertiseHastaNivel(datos.classId, datos.level) > 0 && (
        <div className="rounded-lg border border-white/10 bg-surface/50 p-3">
          <p className="mb-2 font-medium">
            Expertise ({cantidadExpertiseHastaNivel(datos.classId, datos.level)} pericias)
          </p>
          <ul className="space-y-1 text-xs">
            {(
              [
                ...new Set([
                  ...beneficiosOrigen.skills,
                  ...periciasClaseDesdeElecciones(datos.classId, originChoices.class),
                ]),
              ] as SkillKey[]
            ).map((skill) => {
              const expertise = datos.expertise ?? [];
              const max = cantidadExpertiseHastaNivel(datos.classId, datos.level);
              return (
                <li key={skill}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={expertise.includes(skill)}
                      onChange={() => {
                        const has = expertise.includes(skill);
                        if (has) {
                          actualizar({
                            expertise: expertise.filter((s) => s !== skill),
                          });
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
        </div>
      )}
      {datos.level > 1 && (
        <div className="rounded-lg border border-white/10 bg-surface/50 p-3">
          <p className="mb-1 font-medium">Hitos de nivel 2–{datos.level}</p>
          <ul className="list-inside list-disc text-muted">
            {Array.from({ length: datos.level - 1 }, (_, i) => i + 2).flatMap((lvl) =>
              hitosMecanicos(datos.classId, lvl).map((hito) => (
                <li key={`${lvl}-${hito}`}>
                  Niv. {lvl}: {hito}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
      {!datos.backgroundId && (
        <p className="text-amber-200">Trasfondo vacío: personaje incompleto (homebrew).</p>
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
          Pericias de origen: {beneficiosOrigen.skills.map((s) => SKILL_LABELS_ES[s]).join(", ")}
        </p>
      )}
      {beneficiosOrigen.toolProficiencies.length > 0 && (
        <p className="text-muted">Herramientas: {beneficiosOrigen.toolProficiencies.join(", ")}</p>
      )}
      {beneficiosOrigen.feat && (
        <p className="text-muted">
          Dote de trasfondo: {beneficiosOrigen.feat.name}
          {datos.featChoices?.[beneficiosOrigen.feat.id] &&
            ` (${Object.values(datos.featChoices[beneficiosOrigen.feat.id]!)
              .map((id) => SKILL_LABELS_ES[id as SkillKey] ?? id)
              .join(", ")})`}
        </p>
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
  );
}
