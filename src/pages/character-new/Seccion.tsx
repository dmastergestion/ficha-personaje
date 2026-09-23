import type { ReactNode } from "react";

export function Seccion({
  titulo,
  hint,
  children,
}: {
  titulo: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-surface/40 p-3">
      <div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
