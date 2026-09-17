import {
  doteConfigCompleta,
  eleccionesDote,
  idInstanciaDote,
  periciasOcupadasFueraDeDote,
  actualizarEleccionDote,
} from "@/rules/feat-mechanics";
import { nombreDote } from "@/rules/feat-text";
import type { Character, CharacterFeat } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";

export function FeatChoicesFields({
  feat,
  occupiedSkills = [],
  disabled = false,
  onChangeChoices,
}: {
  feat: CharacterFeat;
  occupiedSkills?: readonly string[];
  disabled?: boolean;
  onChangeChoices: (choiceId: string, value: string) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const spellOptions = catalog.spells.map((s) => ({
    id: s.id,
    level: s.level,
    name: catalog.t("spells", s.id, s.nameEn),
  }));
  const defs = eleccionesDote(feat, spellOptions, { occupiedSkills });
  if (defs.length === 0) return null;

  const completa = doteConfigCompleta(feat, { skills: occupiedSkills });

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-panel/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Configuración mecánica
        {!completa && !disabled && (
          <span className="ml-1 normal-case text-amber-200"> · incompleta</span>
        )}
        {disabled && <span className="ml-1 normal-case text-muted"> · fijada en origen</span>}
      </p>
      {defs.map((def) => (
        <label key={def.id} className="block text-sm">
          <span className="text-muted">{def.label}</span>
          {def.hint && !disabled && (
            <span className="ml-1 text-xs text-muted">({def.hint})</span>
          )}
          <select
            className="sheet-select mt-1 disabled:opacity-70"
            value={feat.choices?.[def.id] ?? ""}
            disabled={disabled}
            onChange={(e) => onChangeChoices(def.id, e.target.value)}
          >
            <option value="">Elegir…</option>
            {def.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

export function OriginGrantedFeatsConfig({
  feats,
  choicesByFeatId,
  occupiedSkills,
  onChangeFeat,
}: {
  feats: CharacterFeat[];
  choicesByFeatId: Record<string, Record<string, string>>;
  occupiedSkills: readonly string[];
  onChangeFeat: (featId: string, choices: Record<string, string>) => void;
}) {
  const configurables = feats
    .map((feat) => {
      const merged: CharacterFeat = {
        ...feat,
        choices: { ...feat.choices, ...choicesByFeatId[feat.id] },
      };
      return { feat: merged, defs: eleccionesDote(merged, [], { occupiedSkills }) };
    })
    .filter((row) => row.defs.length > 0);

  if (configurables.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div>
        <p className="text-sm font-medium">Dote de origen</p>
        <p className="text-xs text-muted">
          Elige aquí las pericias o conjuros que concede la dote del trasfondo o de la especie.
          Quedarán fijadas al crear el personaje.
        </p>
      </div>
      {configurables.map(({ feat }) => (
        <div key={feat.id}>
          <p className="text-sm font-medium">{nombreDote(feat.id)}</p>
          <FeatChoicesFields
            feat={feat}
            occupiedSkills={occupiedSkills}
            onChangeChoices={(choiceId, value) =>
              onChangeFeat(feat.id, { ...feat.choices, [choiceId]: value })
            }
          />
        </div>
      ))}
    </div>
  );
}

export function FeatChoicesForm({
  character,
  feat,
  onChange,
  disabled = false,
}: {
  character: Character;
  feat: CharacterFeat;
  onChange: (next: Character) => void;
  disabled?: boolean;
}) {
  const instanceId = idInstanciaDote(feat);
  const occupiedSkills = periciasOcupadasFueraDeDote(character, instanceId);

  return (
    <FeatChoicesFields
      feat={feat}
      occupiedSkills={occupiedSkills}
      disabled={disabled}
      onChangeChoices={(choiceId, value) =>
        onChange(actualizarEleccionDote(character, instanceId, choiceId, value))
      }
    />
  );
}
