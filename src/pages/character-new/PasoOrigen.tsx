import { OriginChoicesForm } from "@/components/OriginChoicesForm";
import { OriginGrantedFeatsConfig } from "@/components/FeatChoicesForm";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import { PericiasClaseForm } from "@/pages/character-new/PericiasClaseForm";
import type { GameCatalog } from "@/rules/catalog";
import type { DatosAsistente } from "@/rules/creation";
import {
  agruparTrasfondosPorClase,
  type BeneficiosOrigen,
  type OrigenCatalogo,
} from "@/rules/origin-benefits";
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
  const { alineados, otros } = agruparTrasfondosPorClase(datos.classId, catalog.backgrounds);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Origen</h2>
        <p className="text-sm text-muted">
          Primero el trasfondo (atributos y dote) y después la especie. El trasfondo es
          obligatorio. Los de arriba suben el atributo principal de tu clase.
        </p>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Trasfondo</span>
        <select
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
          value={datos.backgroundId ?? ""}
          onChange={(e) => actualizar({ backgroundId: e.target.value || null })}
        >
          <option value="">— Elige trasfondo —</option>
          {alineados.length > 0 && (
            <optgroup label="Encajan con tu clase">
              {alineados.map((b) => (
                <option key={b.id} value={b.id}>
                  {catalog.t("backgrounds", b.id, b.nameEn)}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={alineados.length > 0 ? "Otros" : "Trasfondos"}>
            {otros.map((b) => (
              <option key={b.id} value={b.id}>
                {catalog.t("backgrounds", b.id, b.nameEn)}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <SpeciesPicker
        catalog={catalog}
        speciesId={datos.speciesId}
        allowEmpty
        onChange={(speciesId) => actualizar({ speciesId })}
      />
      {(datos.speciesId || datos.backgroundId) && (
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
      )}
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
      <PericiasClaseForm
        datos={datos}
        originChoices={originChoices}
        skillsOrigen={beneficiosOrigen.skills}
        actualizar={actualizar}
      />
    </div>
  );
}
