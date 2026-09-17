import { useState } from "react";
import type { ConditionId } from "@/lib/conditions";
import { CONDITION_IDS, CONDITION_LABELS_ES } from "@/lib/conditions";
import type { Character } from "@/schemas/character";
import { aplicarCondicionesPersonaje } from "@/rules/effects";

function alternarCondicion(character: Character, id: ConditionId): Character {
  const active = character.combat.conditionIds.includes(id);
  const ids = active
    ? character.combat.conditionIds.filter((c) => c !== id)
    : [...character.combat.conditionIds, id];
  return aplicarCondicionesPersonaje(character, ids);
}

/** Condiciones activas siempre visibles, con panel para marcar más. */
export function ConditionStrip({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const activas = character.combat.conditionIds;
  const agotamiento = character.combat.exhaustionLevel;
  const propias = character.combat.conditionsCustom;
  const vacio = activas.length === 0 && agotamiento === 0 && propias.length === 0;

  return (
    <section className="mb-2" aria-label="Condiciones">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-cream">Condiciones</span>
        {vacio && <span className="text-xs text-muted">Ninguna</span>}
        {activas.map((id) => (
          <button
            key={id}
            type="button"
            className="rounded-full border border-danger/30 bg-danger/15 px-2 py-0.5 text-xs text-cream"
            aria-label={`Quitar ${CONDITION_LABELS_ES[id]}`}
            onClick={() => onChange(alternarCondicion(character, id))}
          >
            {CONDITION_LABELS_ES[id]} ×
          </button>
        ))}
        {agotamiento > 0 && (
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-muted">
            Agot. {agotamiento}
          </span>
        )}
        {propias.map((nota) => (
          <span
            key={nota}
            className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-muted"
          >
            {nota}
          </span>
        ))}
        <button
          type="button"
          className="rounded-lg border border-white/15 px-2 py-0.5 text-xs text-muted hover:text-cream"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Cerrar" : "Marcar"}
        </button>
      </div>
      {abierto && (
        <div className="mt-2 rounded-xl border border-white/10 bg-panel p-2">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
            {CONDITION_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activas.includes(id)}
                  onChange={() => onChange(alternarCondicion(character, id))}
                />
                {CONDITION_LABELS_ES[id]}
              </label>
            ))}
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <span className="text-muted">Agotamiento</span>
            <input
              type="number"
              min={0}
              max={6}
              className="w-16 rounded-lg border border-white/10 bg-surface px-2 py-1"
              value={agotamiento}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    exhaustionLevel: Math.min(6, Math.max(0, Number(e.target.value) || 0)),
                  },
                })
              }
            />
          </label>
        </div>
      )}
    </section>
  );
}
