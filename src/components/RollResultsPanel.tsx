import { AtaqueResultBanner } from "@/components/AtaqueResultBanner";
import { UltimaTiradaBanner } from "@/components/UltimaTiradaBanner";
import { useUiStore } from "@/stores/ui-store";

export function RollResultsPanel({ className }: { className?: string }) {
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);
  const ultimoAtaque = useUiStore((s) => s.ultimoAtaque);
  const ultimaTiradaExtra = useUiStore((s) => s.ultimaTiradaExtra);

  return (
    <div className={className}>
      <h3 className="mb-2 text-sm font-semibold">Última tirada</h3>
      {ultimoAtaque ? (
        <AtaqueResultBanner result={ultimoAtaque} />
      ) : ultimaTirada || ultimaTiradaExtra ? (
        <UltimaTiradaBanner roll={ultimaTirada} extra={ultimaTiradaExtra ?? undefined} />
      ) : (
        <p className="text-sm leading-relaxed text-muted">
          Las tiradas de ataque, salvación, pericias y conjuros aparecerán aquí.
        </p>
      )}
    </div>
  );
}
