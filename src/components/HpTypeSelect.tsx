import { DAMAGE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

export function HpTypeSelect({
  className,
  required = false,
}: {
  className?: string;
  required?: boolean;
}) {
  const tipoDanio = useUiStore((s) => s.tipoDanio);
  const setTipoDanio = useUiStore((s) => s.setTipoDanio);
  const faltaTipo = required && !tipoDanio;

  return (
    <select
      className={cn(
        "sheet-input-sm max-w-[9rem] py-1 text-xs",
        faltaTipo && "ring-1 ring-amber-400/70",
        className,
      )}
      aria-label="Tipo de daño (opcional)"
      aria-invalid={faltaTipo || undefined}
      value={tipoDanio}
      onChange={(e) => setTipoDanio(e.target.value)}
    >
      <option value="">Sin tipo</option>
      {DAMAGE_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
