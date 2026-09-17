import { cn } from "@/lib/utils";

export function UsosContador({
  restantes,
  max,
  compact = false,
  etiqueta = "usos",
}: {
  restantes: number;
  max: number;
  compact?: boolean;
  etiqueta?: string;
}) {
  const vacio = restantes <= 0;
  const texto = `${restantes} de ${max} ${etiqueta}`;

  if (max > 0 && max <= 6 && !compact) {
    return (
      <span className="inline-flex items-center gap-1.5" title={texto} aria-label={texto}>
        <span className="inline-flex gap-0.5" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={i < restantes ? "text-cream" : "text-muted/35"}>
              ●
            </span>
          ))}
        </span>
        <span
          className={cn(
            "tabular-nums font-semibold",
            vacio ? "text-danger" : "text-cream",
          )}
        >
          {restantes}/{max}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "tabular-nums",
        compact ? "text-base font-bold" : "text-lg font-bold",
        vacio ? "text-danger" : "text-cream",
      )}
      title={texto}
      aria-label={texto}
    >
      {restantes}
      <span className="font-medium text-muted">/{max}</span>
    </span>
  );
}
