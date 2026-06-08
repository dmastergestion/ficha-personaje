import type { RollMode } from "@/rules/dice";

export function RollModeSelector({
  mode,
  onChange,
}: {
  mode: RollMode;
  onChange: (mode: RollMode) => void;
}) {
  const modes: { id: RollMode; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "advantage", label: "Ventaja" },
    { id: "disadvantage", label: "Desventaja" },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`rounded-lg px-2 py-1 text-xs transition ${
            mode === m.id ? "bg-gold font-semibold text-black" : "bg-surface text-muted hover:text-white"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
