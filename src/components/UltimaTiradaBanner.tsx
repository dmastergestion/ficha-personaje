import type { D20Roll } from "@/rules/dice";

export function UltimaTiradaBanner({
  roll,
  extra,
}: {
  roll: D20Roll | null;
  extra?: string;
}) {
  if (!roll && !extra) return null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-3 text-sm leading-relaxed">
      {roll && (
        <p>
          Tirada ({roll.mode}): {roll.used} + {roll.modifier} ={" "}
          <strong className="text-lg tabular-nums">{roll.total}</strong>
          {roll.isCritical && " · ¡Crítico!"}
          {roll.isFumble && " · ¡Pifia!"}
        </p>
      )}
      {extra && <p className={roll ? "mt-1 text-muted" : undefined}>{extra}</p>}
    </div>
  );
}
