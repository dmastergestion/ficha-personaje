import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import { ABILITY_LABELS_ES, SKILL_LABELS_ES } from "@/rules/character";
import {
  cantidadExpertiseHastaNivel,
  cantidadMejorasAtributosHastaNivel,
  hitosMecanicos,
} from "@/rules/class-features";
import { periciasClaseDesdeElecciones } from "@/rules/class-skills";
import { mejorasCreacionVacias, textoMejoraCreacion } from "@/rules/creation-wizard";
import { nombreDote } from "@/rules/feat-text";
import { etiquetaHerramienta } from "@/lib/origin-text";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import type { BeneficiosOrigen, OrigenCatalogo } from "@/rules/origin-benefits";
import { resumenEleccionesOrigen, type OriginChoices } from "@/rules/origin-choices";
import { pvMaximoPersonaje } from "@/rules/resources";
import { obtenerClase } from "@/rules/srd";
import type { PasoAsistenteId } from "@/pages/character-new/types";

export function PasoResumen({
  catalog,
  datos,
  catalogoOrigen,
  originChoices,
  beneficiosOrigen,
  atributosFinales,
  pendientes,
  onIrAPaso,
}: {
  catalog: GameCatalog;
  datos: DatosAsistente;
  catalogoOrigen: OrigenCatalogo;
  originChoices: OriginChoices;
  beneficiosOrigen: BeneficiosOrigen;
  atributosFinales: Record<AbilityKey, number>;
  pendientes: { pasoId: PasoAsistenteId; titulo: string; mensaje: string }[];
  onIrAPaso: (pasoId: PasoAsistenteId) => void;
}) {
  const nMejoras = cantidadMejorasAtributosHastaNivel(datos.classId, datos.level);
  const nExpertise = cantidadExpertiseHastaNivel(datos.classId, datos.level);
  const periciasClase = periciasClaseDesdeElecciones(datos.classId, originChoices.class);

  return (
    <div className="space-y-3 text-sm">
      <div>
        <h2 className="text-lg font-semibold">Resumen</h2>
        <p className="text-muted">
          Comprueba que no falte ninguna elección. Si algo está incompleto, el botón te lleva al
          paso.
        </p>
      </div>

      {pendientes.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-100">
          <p className="font-medium">Falta por elegir</p>
          <ul className="space-y-1">
            {pendientes.map((p) => (
              <li key={p.pasoId} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {p.titulo}: {p.mensaje}
                </span>
                <button
                  type="button"
                  className="rounded border border-amber-400/50 px-2 py-1 text-xs hover:bg-amber-400/10"
                  onClick={() => onIrAPaso(p.pasoId)}
                >
                  Ir a {p.titulo}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p>
        <strong>{datos.name}</strong> · {datos.playerName || "Sin jugador"}
      </p>
      <p>
        {datos.speciesId ? catalog.t("species", datos.speciesId, "—") : "Sin especie"} ·{" "}
        {catalog.t("classes", datos.classId, "Sin clase")} · Nivel {datos.level}
      </p>
      {datos.subclassId && (
        <p>Subclase: {catalog.t("subclasses", datos.subclassId, datos.subclassId)}</p>
      )}
      {datos.backgroundId && (
        <p>Trasfondo: {catalog.t("backgrounds", datos.backgroundId, datos.backgroundId)}</p>
      )}
      {nMejoras > 0 && (
        <div className="rounded-lg border border-white/10 bg-surface/50 p-3">
          <p className="mb-1 font-medium">Mejoras de nivel</p>
          <ul className="list-inside list-disc text-muted">
            {mejorasCreacionVacias(nMejoras, datos.mejorasNivel).map((mejora, i) => (
              <li key={i}>{textoMejoraCreacion(mejora)}</li>
            ))}
          </ul>
        </div>
      )}
      {nExpertise > 0 && (
        <p className="text-muted">
          Expertise:{" "}
          {(datos.expertise ?? []).map((s) => SKILL_LABELS_ES[s]).join(", ") || "sin elegir"}
        </p>
      )}
      {periciasClase.length > 0 && (
        <p className="text-muted">
          Pericias de clase: {periciasClase.map((s) => SKILL_LABELS_ES[s]).join(", ")}
        </p>
      )}
      {datos.fightingStyleFeatId && (
        <p className="text-muted">Estilo de combate: {nombreDote(datos.fightingStyleFeatId)}</p>
      )}
      {datos.level > 1 && (
        <div className="rounded-lg border border-white/10 bg-surface/50 p-3">
          <p className="mb-1 font-medium">Hitos de nivel 2–{datos.level}</p>
          <ul className="list-inside list-disc text-muted">
            {Array.from({ length: datos.level - 1 }, (_, i) => i + 2).flatMap((lvl) =>
              hitosMecanicos(datos.classId ?? "", lvl).map((hito) => (
                <li key={`${lvl}-${hito}`}>
                  Niv. {lvl}: {hito}
                </li>
              )),
            )}
          </ul>
        </div>
      )}
      <p>
        PV estimados:{" "}
        {pvMaximoPersonaje(
          obtenerClase(datos.classId ?? "")?.hitDie ?? "d8",
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
        <p className="text-muted">
          Herramientas: {beneficiosOrigen.toolProficiencies.map(etiquetaHerramienta).join(", ")}
        </p>
      )}
      {beneficiosOrigen.feat && (
        <p className="text-muted">
          Dote de trasfondo: {nombreDote(beneficiosOrigen.feat.id)}
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
              {bonus > 0 && <span className="text-accent"> (+{bonus})</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
