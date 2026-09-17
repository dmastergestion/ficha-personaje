import { CharacterPortraitField } from "@/components/CharacterPortraitField";
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
    <div className="sheet-tab-stack">
      <section className="sheet-card">
        <h3 className="sheet-section-title">Trasfondo y personalidad</h3>
        <div className="flex flex-col gap-2">
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
          <CharacterPortraitField
            portraitImage={character.portraitImage}
            onChange={(portraitImage) => onChange({ ...character, portraitImage })}
          />
        </div>
      </section>
      <section className="sheet-card">
        <h3 className="sheet-section-title">Notas libres</h3>
        <textarea
          className="sheet-input min-h-48"
          placeholder="Notas, contenido propio, rasgos de campaña…"
          value={character.notes}
          onChange={(e) => onChange({ ...character, notes: e.target.value })}
        />
      </section>
    </div>
  );
}
