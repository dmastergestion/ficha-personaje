import type { SrdBackground, SrdSpecies } from "@/rules/srd";
import { descripcionDote, idDoteDesdeTexto, nombreDote } from "@/rules/feat-text";

function Lista({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <p className="text-xs">
      <span className="text-muted">{label}: </span>
      {items.join(", ")}
    </p>
  );
}

export function SpeciesInfoPanel({
  species,
  name,
}: {
  species: SrdSpecies;
  name: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-3 text-sm">
      <p className="mb-1 font-semibold">{name}</p>
      <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted">
        {species.size && <span>Tamaño: {species.size}</span>}
        {species.speed !== undefined && <span>Velocidad: {species.speed} pies</span>}
      </div>
      <Lista label="Pericias" items={species.skillProficiencies} />
      {species.traits ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {species.traits}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">Sin rasgos detallados en el catálogo.</p>
      )}
    </div>
  );
}

export function BackgroundInfoPanel({
  background,
  name,
}: {
  background: SrdBackground;
  name: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-3 text-sm">
      <p className="mb-1 font-semibold">{name}</p>
      <Lista label="Pericias" items={background.skillProficiencies} />
      <Lista label="Herramientas" items={background.toolProficiencies} />
      {background.feat && (() => {
        const featId = idDoteDesdeTexto(background.feat);
        const extra = background.feat.includes("—") || background.feat.includes("-")
          ? background.feat.split(/[—–-]/).slice(1).join("—").trim()
          : "";
        const desc = featId ? descripcionDote(featId) : undefined;
        return (
          <div className="mt-2">
            <p className="text-xs font-medium">
              <span className="text-muted">Dote: </span>
              {featId ? nombreDote(featId) : background.feat}
              {extra ? ` (${extra})` : ""}
            </p>
            {desc && (
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted">{desc}</p>
            )}
          </div>
        );
      })()}
      {background.traits && (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted">
          {background.traits}
        </p>
      )}
    </div>
  );
}
