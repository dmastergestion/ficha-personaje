import type { AbilityKey } from "@/lib/constants";
import { ABILITY_LABELS_ES } from "@/rules/character";
import type { OrigenCatalogo } from "@/rules/origin-benefits";
import {
  bonificacionAtributosCompleta,
  eleccionesAtributosTrasfondo,
  type OriginChoices,
} from "@/rules/origin-choices";

export function OriginAbilityBonusForm({
  backgroundId,
  catalogo,
  choices,
  onChange,
}: {
  backgroundId: string | null;
  catalogo?: OrigenCatalogo;
  choices: OriginChoices;
  onChange: (next: OriginChoices) => void;
}) {
  const defs = eleccionesAtributosTrasfondo(backgroundId, catalogo);
  if (!defs.length) return null;

  const modeDef = defs.find((d) => d.id === "ability-mode")!;
  const plus2Def = defs.find((d) => d.id === "ability-plus-2")!;
  const plus1Def = defs.find((d) => d.id === "ability-plus-1")!;

  const mode = choices.background["ability-mode"] ?? modeDef.defaultValue ?? "even";
  const plus2 = choices.background["ability-plus-2"] ?? plus2Def.defaultValue ?? "";
  const plus1 = choices.background["ability-plus-1"] ?? plus1Def.defaultValue ?? "";

  const attrs = plus2Def.options.map((o) => o.value);
  const plus1Options = plus1Def.options.filter((o) => o.value !== plus2);

  function setBackground(partial: Record<string, string>) {
    onChange({
      ...choices,
      background: { ...choices.background, ...partial },
    });
  }

  function setMode(next: string) {
    setBackground({ "ability-mode": next });
  }

  function setPlus2(value: string) {
    const next: Record<string, string> = { "ability-plus-2": value };
    if (value === plus1) {
      const alt = plus1Def.options.find((o) => o.value !== value);
      if (alt) next["ability-plus-1"] = alt.value;
    }
    setBackground(next);
  }

  const completa = bonificacionAtributosCompleta(backgroundId, choices, catalogo);

  return (
    <div className="space-y-3 rounded-lg border border-gold/30 bg-gold/5 p-3">
      <div>
        <p className="text-sm font-medium text-gold">Bonificación de trasfondo</p>
        <p className="text-xs text-muted">
          Regla 2024: +1 a los tres atributos del trasfondo, o +2 a uno y +1 a otro (solo entre esos
          tres).
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Modo de bonificación</legend>
        {modeDef.options.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm has-[:checked]:border-gold/50 has-[:checked]:bg-gold/10"
          >
            <input
              type="radio"
              name="ability-mode"
              className="mt-1"
              checked={mode === opt.value}
              onChange={() => setMode(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </fieldset>

      {mode === "even" && (
        <p className="text-sm text-muted">
          +1 en:{" "}
          {attrs.map((id) => ABILITY_LABELS_ES[id as AbilityKey]).join(", ")}
        </p>
      )}

      {mode === "split" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{plus2Def.label}</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
              value={plus2}
              onChange={(e) => setPlus2(e.target.value)}
            >
              {plus2Def.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{plus1Def.label}</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
              value={plus1}
              onChange={(e) => setBackground({ "ability-plus-1": e.target.value })}
            >
              {plus1Options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {!completa && mode === "split" && (
        <p className="text-xs text-amber-400">Elige dos atributos distintos para +2 y +1.</p>
      )}
    </div>
  );
}
