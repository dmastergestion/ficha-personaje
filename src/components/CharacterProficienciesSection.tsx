import { SheetCard } from "@/components/sheet-ui";
import { COMMON_LANGUAGES } from "@/lib/constants";
import type { Character } from "@/schemas/character";

export function CharacterLanguagesSection({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  return (
    <SheetCard title="Idiomas">
      <div className="mb-3 flex flex-wrap gap-2">
        {character.proficiencies.languages.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-surface px-2.5 py-1 text-sm"
          >
            {lang}
            <button
              type="button"
              className="text-muted hover:text-white"
              aria-label={`Quitar ${lang}`}
              onClick={() =>
                onChange({
                  ...character,
                  proficiencies: {
                    ...character.proficiencies,
                    languages: character.proficiencies.languages.filter((l) => l !== lang),
                  },
                })
              }
            >
              ×
            </button>
          </span>
        ))}
        {character.proficiencies.languages.length === 0 && (
          <p className="text-sm text-muted">Sin idiomas registrados.</p>
        )}
      </div>
      <select
        className="sheet-select"
        defaultValue=""
        onChange={(e) => {
          const lang = e.target.value;
          if (!lang || character.proficiencies.languages.includes(lang)) return;
          onChange({
            ...character,
            proficiencies: {
              ...character.proficiencies,
              languages: [...character.proficiencies.languages, lang],
            },
          });
          e.target.value = "";
        }}
      >
        <option value="">Añadir idioma…</option>
        {COMMON_LANGUAGES.filter((l) => !character.proficiencies.languages.includes(l)).map(
          (lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ),
        )}
      </select>
    </SheetCard>
  );
}

export function CharacterCompetenciesSection({ character }: { character: Character }) {
  const { armorProficiencies, weaponProficiencies, toolProficiencies } = character.proficiencies;
  const empty =
    armorProficiencies.length === 0 &&
    weaponProficiencies.length === 0 &&
    toolProficiencies.length === 0;

  return (
    <SheetCard title="Competencias">
      {armorProficiencies.length > 0 && (
        <p className="text-sm text-muted">
          <span className="font-medium text-white">Armaduras:</span>{" "}
          {armorProficiencies.join(", ")}
        </p>
      )}
      {weaponProficiencies.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-white">Armas:</span>{" "}
          {weaponProficiencies.join(", ")}
        </p>
      )}
      {toolProficiencies.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-white">Herramientas:</span>{" "}
          {toolProficiencies.join(", ")}
        </p>
      )}
      {empty && (
        <p className="text-sm text-muted">Sin competencias registradas (se asignan al crear).</p>
      )}
    </SheetCard>
  );
}
