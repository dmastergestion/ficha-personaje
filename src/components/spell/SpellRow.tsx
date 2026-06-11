import { Button } from "@/components/layout";
import {
  etiquetaSalvacion,
  etiquetaTipoConjuro,
  metaTiradaConjuro,
} from "@/rules/spell-cast-meta";
import { useCatalogStore } from "@/stores/catalog-store";

export function EtiquetaConcentracion({ spellId }: { spellId: string }) {
  const catalog = useCatalogStore((s) => s.catalog);
  if (!catalog.requiereConcentracion(spellId)) return null;
  return (
    <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
      Conc.
    </span>
  );
}

export function EtiquetaRitual({ spellId }: { spellId: string }) {
  const catalog = useCatalogStore((s) => s.catalog);
  if (!catalog.esRitual(spellId)) return null;
  return (
    <span className="ml-1 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
      Ritual
    </span>
  );
}

function EtiquetaTipoTirada({ spellId }: { spellId: string }) {
  const catalog = useCatalogStore((s) => s.catalog);
  const meta = metaTiradaConjuro(spellId, catalog.obtenerConjuro(spellId));
  const estilo =
    meta.tipo === "attack"
      ? "bg-red-500/20 text-red-300"
      : meta.tipo === "save"
        ? "bg-sky-500/20 text-sky-300"
        : "bg-white/10 text-muted";
  const texto =
    meta.tipo === "save" && meta.save
      ? `Salv. ${etiquetaSalvacion(meta.save)}`
      : etiquetaTipoConjuro(meta.tipo);
  return (
    <>
      <span
        className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estilo}`}
      >
        {texto}
      </span>
      {meta.damage && (
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">
          {meta.damage.dice}
          {meta.damage.type ? ` ${meta.damage.type}` : ""}
        </span>
      )}
    </>
  );
}

export function SpellRow({
  id,
  spellLevel,
  onRemove,
  onCast,
  onInfo,
}: {
  id: string;
  spellLevel: number;
  onRemove: () => void;
  onCast: () => void;
  onInfo: () => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <button type="button" className="min-w-0 text-left hover:text-gold" onClick={onInfo}>
        {catalog.t("spells", id, id)}
        <EtiquetaTipoTirada spellId={id} />
        <EtiquetaConcentracion spellId={id} />
        <EtiquetaRitual spellId={id} />
        {spellLevel > 0 && <span className="text-muted"> (niv {spellLevel})</span>}
      </button>
      <div className="flex gap-1">
        <Button variant="ghost" onClick={onInfo}>
          Info
        </Button>
        <Button variant="critical" onClick={onCast}>
          Lanzar
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          Quitar
        </Button>
      </div>
    </li>
  );
}
