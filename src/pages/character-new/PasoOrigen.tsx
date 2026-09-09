import { OriginChoicesForm } from "@/components/OriginChoicesForm";
import { OriginGrantedFeatsConfig } from "@/components/FeatChoicesForm";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import type { BeneficiosOrigen, OrigenCatalogo } from "@/rules/origin-benefits";
import type { OriginChoices } from "@/rules/origin-choices";

export function PasoOrigen({
  catalog,
  datos,
  actualizar,
  catalogoOrigen,
  originChoices,
  beneficiosOrigen,
}: {
  catalog: GameCatalog;
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
  catalogoOrigen: OrigenCatalogo;
  originChoices: OriginChoices;
  beneficiosOrigen: BeneficiosOrigen;
}) {
  return (
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
      {!datos.backgroundId && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Sin trasfondo: el personaje queda incompleto (homebrew). Puedes seguir y editar dote y ASI
          de origen más tarde en Resumen.
        </p>
      )}
      <OriginChoicesForm
        speciesId={datos.speciesId}
        backgroundId={datos.backgroundId}
        level={datos.level}
        catalogo={catalogoOrigen}
        choices={originChoices}
        onChange={(next) => actualizar({ originChoices: next })}
        mode="create"
        omitirBonificacionAtributos
      />
      <OriginGrantedFeatsConfig
        feats={[beneficiosOrigen.speciesFeat, beneficiosOrigen.feat].filter(
          (f): f is NonNullable<typeof f> => !!f,
        )}
        choicesByFeatId={datos.featChoices ?? {}}
        occupiedSkills={beneficiosOrigen.skills}
        onChangeFeat={(featId, choices) =>
          actualizar({
            featChoices: { ...datos.featChoices, [featId]: choices },
          })
        }
      />
    </div>
  );
}
