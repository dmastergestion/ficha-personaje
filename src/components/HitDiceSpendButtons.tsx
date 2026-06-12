import { Button } from "@/components/layout";
import { cn } from "@/lib/utils";
import { poolDadosGolpe, totalDadosDisponibles, mensajeTiradaDadoGolpe } from "@/rules/hit-dice";
import { gastarDadoGolpe } from "@/rules/rests";
import type { Character } from "@/schemas/character";

export function HitDiceSpendButtons({
  character,
  onChange,
  onRoll,
  compact = false,
  className,
}: {
  character: Character;
  onChange: (next: Character) => void;
  onRoll?: (message: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const pool = poolDadosGolpe(character);
  const disponiblesTotal = totalDadosDisponibles(pool);
  const opciones = pool.filter((row) => row.disponibles > 0);

  if (disponiblesTotal === 0) {
    if (compact) return null;
    return (
      <span className={cn("text-xs text-muted", className)}>
        Sin dados · recupera con descanso largo
      </span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {opciones.map(({ die, disponibles }) => (
        <Button
          key={die}
          variant="combat"
          className={compact ? "px-2 py-0.5 text-xs" : "px-2 py-1 text-xs"}
          title={`Descanso corto: tira ${die} + mod. CON y recuperas PV`}
          onClick={() => {
            const result = gastarDadoGolpe(character, die);
            if (!result) return;
            onChange(result.character);
            onRoll?.(mensajeTiradaDadoGolpe(die, result.tirada, result.conMod, result.curacion));
          }}
        >
          {opciones.length > 1 ? `Gastar ${die}` : "Gastar dado"}
          {disponibles > 1 ? ` ×${disponibles}` : ""}
        </Button>
      ))}
    </div>
  );
}
