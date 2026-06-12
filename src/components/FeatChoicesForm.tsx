import {
  actualizarEleccionDote,
  doteConfigCompleta,
  eleccionesDote,
  idInstanciaDote,
} from "@/rules/feat-mechanics";
import type { CharacterFeat } from "@/schemas/character";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";

export function FeatChoicesForm({
  character,
  feat,
  onChange,
}: {
  character: Character;
  feat: CharacterFeat;
  onChange: (next: Character) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const spellOptions = catalog.spells.map((s) => ({
    id: s.id,
    level: s.level,
    name: catalog.t("spells", s.id, s.nameEn),
  }));
  const defs = eleccionesDote(feat, spellOptions);
  if (defs.length === 0) return null;

  const instanceId = idInstanciaDote(feat);
  const completa = doteConfigCompleta(feat);

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-panel/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Configuración mecánica
        {!completa && <span className="ml-1 normal-case text-gold"> · incompleta</span>}
      </p>
      {defs.map((def) => {
        const options =
          def.id === "cantrip-1" ||
          def.id === "cantrip-2" ||
          def.id === "spell-1" ||
          def.id === "spell-ability"
            ? eleccionesDote(feat, spellOptions).find((d) => d.id === def.id)?.options ?? def.options
            : def.options;

        return (
          <label key={def.id} className="block text-sm">
            <span className="text-muted">{def.label}</span>
            {def.hint && <span className="ml-1 text-xs text-muted">({def.hint})</span>}
            <select
              className="sheet-select mt-1"
              value={feat.choices?.[def.id] ?? ""}
              onChange={(e) =>
                onChange(actualizarEleccionDote(character, instanceId, def.id, e.target.value))
              }
            >
              <option value="">Elegir…</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
