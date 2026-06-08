import type { ConditionId } from "@/lib/conditions";
import { CONDITION_IDS, CONDITION_LABELS_ES } from "@/lib/conditions";
import type { Character } from "@/schemas/character";
import { resumenEfectosActivos } from "@/rules/effects";

interface ConditionPanelProps {
  character: Character;
  onChange: (next: Character) => void;
}

function toggleCondition(character: Character, id: ConditionId): Character {
  const active = character.combat.conditionIds.includes(id);
  return {
    ...character,
    combat: {
      ...character.combat,
      conditionIds: active
        ? character.combat.conditionIds.filter((c) => c !== id)
        : [...character.combat.conditionIds, id],
    },
  };
}

export function ConditionPanel({ character, onChange }: ConditionPanelProps) {
  const resumen = resumenEfectosActivos(
    character.combat.conditionIds,
    character.combat.exhaustionLevel,
  );

  return (
    <section className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-2 font-semibold">Condiciones SRD</h3>
      <div className="mb-3 grid grid-cols-2 gap-1 sm:grid-cols-3">
        {CONDITION_IDS.map((id) => (
          <label key={id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={character.combat.conditionIds.includes(id)}
              onChange={() => onChange(toggleCondition(character, id))}
            />
            {CONDITION_LABELS_ES[id]}
          </label>
        ))}
      </div>

      <label className="mb-3 block text-sm">
        <span className="text-muted">Agotamiento (0–6)</span>
        <input
          type="number"
          min={0}
          max={6}
          className="mt-1 w-20 rounded-lg border border-white/10 bg-surface px-2 py-1"
          value={character.combat.exhaustionLevel}
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

      {resumen.length > 0 && (
        <ul className="mb-3 list-inside list-disc text-xs text-gold">
          {resumen.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <h4 className="mb-1 text-sm font-medium text-muted">Notas / homebrew</h4>
      <textarea
        className="min-h-16 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
        placeholder="Condiciones personalizadas, una por línea"
        value={character.combat.conditionsCustom.join("\n")}
        onChange={(e) =>
          onChange({
            ...character,
            combat: {
              ...character.combat,
              conditionsCustom: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            },
          })
        }
      />
    </section>
  );
}
