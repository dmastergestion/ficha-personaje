import type { RollMode } from "@/rules/dice";

export function RollModeSelector({
  mode,
  onChange,
  compact = false,
}: {
  mode: RollMode;
  onChange: (mode: RollMode) => void;
  compact?: boolean;
}) {
  const modes: { id: RollMode; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "advantage", label: "Ventaja" },
    { id: "disadvantage", label: "Desventaja" },
  ];

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Modo de tirada">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={mode === m.id}
          aria-label={`Tirada ${m.label}`}
          onClick={() => onChange(m.id)}
          className={`rounded-lg text-xs transition ${
            compact ? "px-1.5 py-0.5" : "px-2 py-1"
          } ${mode === m.id ? "bg-accent font-semibold text-ink" : "bg-surface text-muted hover:text-cream"}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
