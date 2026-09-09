import { Button } from "@/components/layout";
import { EtiquetaConcentracion, EtiquetaRitual } from "@/components/spell/SpellRow";

export function SpellCatalogRow({
  spellId,
  name,
  level,
  onInfo,
  onAdd,
  addLabel = "Añadir",
  addDisabled = false,
}: {
  spellId: string;
  name: string;
  level: number;
  onInfo: () => void;
  onAdd: () => void;
  addLabel?: string;
  addDisabled?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 border-b border-white/5 last:border-0">
      <button
        type="button"
        className="min-w-0 flex-1 px-3 py-2.5 text-left hover:bg-white/5"
        onClick={onInfo}
      >
        <span className="font-medium">{name}</span>
        <span className="ml-1.5 text-sm text-muted">
          {level === 0 ? "Truco" : `Niv. ${level}`}
        </span>
        <EtiquetaConcentracion spellId={spellId} />
        <EtiquetaRitual spellId={spellId} />
      </button>
      <Button className="mr-2 shrink-0" disabled={addDisabled} onClick={onAdd}>
        {addLabel}
      </Button>
    </li>
  );
}
