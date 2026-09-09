import { cn } from "@/lib/utils";

export function RecursoSinEspacioBadge({
  disponibles,
  max,
  onGastar,
  className,
}: {
  disponibles: number;
  max: number;
  onGastar: () => void;
  className?: string;
}) {
  const gastado = disponibles <= 0;

  if (gastado) {
    return (
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          "bg-red-500/15 text-red-300/90",
          className,
        )}
        title={`Uso gratis gastado (0/${max}). Recupera con descanso o el botón + del contador.`}
      >
        Uso gastado
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        "bg-emerald-500/15 text-emerald-300/90 hover:bg-emerald-500/30",
        className,
      )}
      title={`Marcar uso gratis (${disponibles}/${max} restantes). No lanza el conjuro ni gasta espacios.`}
      onClick={onGastar}
    >
      Marcar uso
    </button>
  );
}
