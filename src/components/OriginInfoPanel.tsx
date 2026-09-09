import type { ReactNode } from "react";
import type { SrdBackground, SrdSpecies } from "@/rules/srd";
import { ABILITY_LABELS_ES } from "@/rules/character";
import type { AbilityKey } from "@/lib/constants";
import { etiquetaHerramienta } from "@/lib/origin-text";
import { descripcionOrigenEs } from "@/rules/origin-description";
import { descripcionDote, idDoteDesdeTexto, nombreDote } from "@/rules/feat-text";
import {
  calcularBeneficiosOrigen,
  etiquetasPericiasOrigen,
  type OrigenCatalogo,
} from "@/rules/origin-benefits";
import type { OriginChoices } from "@/rules/origin-choices";

function Lista({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <p className="text-sm">
      <span className="text-muted">{label}: </span>
      {items.join(", ")}
    </p>
  );
}

function BloqueObtienes({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 space-y-1 rounded-md border border-gold/20 bg-gold/5 px-2 py-2">
      <p className="text-sm font-semibold text-gold">Obtienes</p>
      {children}
    </div>
  );
}

function BonosAtributo({ bonuses }: { bonuses: Partial<Record<AbilityKey, number>> }) {
  const entries = Object.entries(bonuses).filter(([, v]) => v && v > 0) as [AbilityKey, number][];
  if (!entries.length) return null;
  return (
    <p className="text-sm">
      <span className="text-muted">Atributos: </span>
      {entries
        .map(([key, bonus]) => `${ABILITY_LABELS_ES[key]} +${bonus}`)
        .join(", ")}
    </p>
  );
}

export function SpeciesInfoPanel({
  species,
  name,
  speciesId,
  level = 1,
  catalogo,
}: {
  species: SrdSpecies;
  name: string;
  speciesId?: string;
  level?: number;
  catalogo?: OrigenCatalogo;
}) {
  const beneficios = calcularBeneficiosOrigen(speciesId ?? species.id, null, level, catalogo);
  const pericias = etiquetasPericiasOrigen(species.skillProficiencies);
  const rasgos =
    descripcionOrigenEs("species", speciesId ?? species.id, species.traits) ?? "";
  const tieneResumen = pericias.length > 0 || beneficios.hpBonusTotal > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-2.5 text-sm">
      <p className="mb-1 font-semibold">{name}</p>
      <div className="mb-2 flex flex-wrap gap-2 text-sm text-muted">
        {species.size && <span>Tamaño: {species.size}</span>}
        {species.speed !== undefined && <span>Velocidad: {species.speed} pies</span>}
      </div>

      {tieneResumen && (
        <BloqueObtienes>
          <Lista label="Pericias" items={pericias} />
          {beneficios.hpBonusTotal > 0 && (
            <p className="text-sm">
              <span className="text-muted">Puntos de golpe: </span>+{beneficios.hpBonusTotal} en
              total (+1 por nivel)
            </p>
          )}
        </BloqueObtienes>
      )}

      {rasgos ? (
        <p className="sheet-prose mt-2">{rasgos}</p>
      ) : !tieneResumen ? (
        <p className="mt-1 text-sm text-muted">Sin rasgos detallados en el catálogo.</p>
      ) : null}
    </div>
  );
}

export function BackgroundInfoPanel({
  background,
  name,
  backgroundId,
  level = 1,
  catalogo,
  elecciones,
  detalleDote = true,
}: {
  background: SrdBackground;
  name: string;
  backgroundId?: string;
  level?: number;
  catalogo?: OrigenCatalogo;
  elecciones?: OriginChoices;
  /** Si es false, solo el nombre de la dote (el texto largo está en Dotes). */
  detalleDote?: boolean;
}) {
  const beneficios = calcularBeneficiosOrigen(
    null,
    backgroundId ?? background.id,
    level,
    catalogo,
    elecciones,
  );
  const pericias = etiquetasPericiasOrigen(background.skillProficiencies);
  const herramientas = (background.toolProficiencies ?? []).map(etiquetaHerramienta);
  const featId = background.feat ? idDoteDesdeTexto(background.feat) : undefined;
  const featExtra =
    background.feat?.includes("—") || background.feat?.includes("-")
      ? background.feat.split(/[—–-]/).slice(1).join("—").trim()
      : "";
  const featDesc = featId ? descripcionDote(featId, featExtra) : undefined;
  const traitsExtra =
    descripcionOrigenEs("backgrounds", backgroundId ?? background.id) ?? "";

  const tieneBloque =
    pericias.length > 0 ||
    herramientas.length > 0 ||
    !!beneficios.feat ||
    Object.keys(beneficios.abilityBonuses).length > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-2.5 text-sm">
      <p className="mb-1 font-semibold">{name}</p>

      {tieneBloque ? (
        <BloqueObtienes>
          <BonosAtributo bonuses={beneficios.abilityBonuses} />
          <Lista label="Pericias" items={pericias} />
          <Lista label="Herramientas" items={herramientas} />
          {beneficios.feat && (
            <div>
              <p className="text-sm">
                <span className="text-muted">Dote: </span>
                {beneficios.feat.name}
                {beneficios.feat.notes ? ` (${beneficios.feat.notes})` : ""}
              </p>
              {detalleDote && featDesc && (
                <p className="sheet-prose mt-1">
                  {featDesc}
                </p>
              )}
            </div>
          )}
        </BloqueObtienes>
      ) : (
        <p className="mt-1 text-sm text-muted">Sin beneficios mecánicos registrados.</p>
      )}

      {background.feat && !beneficios.feat && (
        <div className="mt-2">
          <p className="text-sm font-medium">
            <span className="text-muted">Dote: </span>
            {featId ? nombreDote(featId) : background.feat}
            {featExtra ? ` (${featExtra})` : ""}
          </p>
          {detalleDote && featDesc && (
            <p className="sheet-prose mt-1">{featDesc}</p>
          )}
        </div>
      )}

      {!tieneBloque && traitsExtra && (
        <p className="sheet-prose mt-2">{traitsExtra}</p>
      )}
    </div>
  );
}
