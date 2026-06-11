import { formatearD20, type ResultadoAtaque } from "@/rules/attack-roll";

export function AtaqueResultBanner({ result }: { result: ResultadoAtaque | null }) {
  if (!result) return null;

  const impactoClass =
    result.impacta === true
      ? "border-green-500/40 bg-green-500/10"
      : result.impacta === false
        ? "border-red-500/40 bg-red-500/10"
        : "border-accent/30 bg-accent/10";

  return (
    <div className={`rounded-lg border px-3 py-3 text-sm leading-relaxed ${impactoClass}`}>
      <p className="text-base font-semibold">{result.attackName}</p>
      <p className="mt-1">
        <span className="text-muted">Ataque </span>
        ({result.toHit.mode}): {formatearD20(result.toHit)}
        {result.toHit.rolls.length === 2 && (
          <span className="text-muted"> → total {result.toHit.total}</span>
        )}
        {result.toHit.isCritical && " · ¡Crítico!"}
        {result.toHit.isFumble && " · ¡Pifia!"}
      </p>
      <p className="text-xs text-muted">{result.explicacionToHit}</p>
      {result.explicacionImpacto && (
        <p className="mt-1">
          {result.targetAc !== null ? (
            <>
              <span className="text-muted">vs CA {result.targetAc}: </span>
              {result.explicacionImpacto}
            </>
          ) : (
            result.explicacionImpacto
          )}
        </p>
      )}
      {result.explicacionDaño && (
        <p className="mt-1">
          <span className="text-muted">Daño: </span>
          {result.explicacionDaño}
        </p>
      )}
    </div>
  );
}
