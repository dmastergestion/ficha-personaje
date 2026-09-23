import type { DatosAsistente } from "@/rules/creation";

export function PasoIdentidad({
  datos,
  actualizar,
}: {
  datos: DatosAsistente;
  actualizar: (partial: Partial<DatosAsistente>) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">¿Cómo se llama tu personaje?</h2>
      <p className="text-sm text-muted">
        PHB 2024 deja el nombre para el final, cuando ya está el resto. El del jugador es opcional.
      </p>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Nombre del personaje</span>
        <input
          autoFocus
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
          value={datos.name}
          onChange={(e) => actualizar({ name: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Nombre del jugador</span>
        <input
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
          value={datos.playerName}
          onChange={(e) => actualizar({ playerName: e.target.value })}
        />
      </label>
    </div>
  );
}
