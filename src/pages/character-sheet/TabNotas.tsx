import { FeatPicker } from "@/components/FeatPicker";
import {
  CharacterCompetenciesSection,
  CharacterLanguagesSection,
} from "@/components/CharacterProficienciesSection";
import type { SheetTabProps } from "@/pages/character-sheet/types";

const ROLEPLAY_FIELDS = [
  { key: "appearance" as const, label: "Apariencia" },
  { key: "personalityTraits" as const, label: "Rasgos de personalidad" },
  { key: "ideals" as const, label: "Ideales" },
  { key: "bonds" as const, label: "Vínculos" },
  { key: "flaws" as const, label: "Defectos" },
];

export function TabNotas({ character, onChange }: SheetTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="sheet-card">
          <h3 className="sheet-section-title">Trasfondo y personalidad</h3>
          <div className="space-y-3">
            {ROLEPLAY_FIELDS.map(({ key, label }) => (
              <label key={key} className="block space-y-1 text-sm">
                <span className="text-muted">{label}</span>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  value={character.roleplay[key]}
                  onChange={(e) =>
                    onChange({
                      ...character,
                      roleplay: { ...character.roleplay, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </section>
        <div className="space-y-4">
          <CharacterLanguagesSection character={character} onChange={onChange} />
          <CharacterCompetenciesSection character={character} />
          <FeatPicker
            feats={character.feats}
            onAdd={(feat) => onChange({ ...character, feats: [...character.feats, feat] })}
            onRemove={(id) =>
              onChange({ ...character, feats: character.feats.filter((f) => f.id !== id) })
            }
          />
        </div>
      </div>
      <section className="sheet-card">
        <h3 className="sheet-section-title">Notas libres</h3>
        <textarea
          className="sheet-input min-h-48"
          placeholder="Notas, homebrew, rasgos de campaña…"
          value={character.notes}
          onChange={(e) => onChange({ ...character, notes: e.target.value })}
        />
      </section>
    </div>
  );
}
