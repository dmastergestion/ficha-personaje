import type { DiceSource } from "@/rules/dice";

export function DiceSourceSelector({
  source,
  onChange,
  compact = false,
}: {
  source: DiceSource;
  onChange: (source: DiceSource) => void;
  compact?: boolean;
}) {
  const modes: { id: DiceSource; label: string }[] = [
    { id: "virtual", label: "Virtual" },
    { id: "physical", label: "Físico" },
  ];

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Fuente del dado">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={source === m.id}
          aria-label={`Dado ${m.label}`}
          onClick={() => onChange(m.id)}
          className={`rounded-lg text-xs transition ${
            compact ? "px-1.5 py-0.5" : "px-2 py-1"
          } ${source === m.id ? "bg-gold font-semibold text-black" : "bg-surface text-muted hover:text-white"}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
