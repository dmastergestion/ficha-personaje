import { ARMOR_PROF_LABELS } from "@/lib/sheet-layout";
import type { Character } from "@/schemas/character";
import { COMMON_LANGUAGES } from "@/lib/constants";
import {
  etiquetaListaCompetenciasArmas,
  etiquetaListaCompetenciasHerramientas,
} from "@/rules/proficiencies";
import { herramientasExtraDotes } from "@/rules/feat-mechanics";

export function ProficienciesPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange?: (next: Character) => void;
}) {
  const armorProf = new Set(character.proficiencies.armorProficiencies);
  const tools = [
    ...new Set([...character.proficiencies.toolProficiencies, ...herramientasExtraDotes(character)]),
  ];

  return (
    <section className="sheet-card">
      <div className="sheet-pdf-proficiencies border-0 bg-transparent p-0">
        <h3 className="sheet-section-title">Competencias</h3>
        <div className="mb-3 flex flex-wrap gap-3">
          {Object.entries(ARMOR_PROF_LABELS).map(([id, label]) => (
            <label key={id} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={armorProf.has(id)} readOnly disabled />
              <span className={armorProf.has(id) ? "" : "text-muted"}>{label}</span>
            </label>
          ))}
        </div>
        <ProficiencyBlock
          label="Armas"
          value={etiquetaListaCompetenciasArmas(character.proficiencies.weaponProficiencies)}
        />
        <ProficiencyBlock
          label="Herramientas"
          value={etiquetaListaCompetenciasHerramientas(tools)}
        />
        <LanguagesBlock character={character} onChange={onChange} />
      </div>
    </section>
  );
}

function ProficiencyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

function LanguagesBlock({
  character,
  onChange,
}: {
  character: Character;
  onChange?: (next: Character) => void;
}) {
  const languages = character.proficiencies.languages;

  if (!onChange) {
    return (
      <ProficiencyBlock label="Idiomas" value={languages.join(", ")} />
    );
  }

  return (
    <div className="mb-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Idiomas</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {languages.map((lang) => (
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
                    languages: languages.filter((l) => l !== lang),
                  },
                })
              }
            >
              ×
            </button>
          </span>
        ))}
        {languages.length === 0 && <p className="text-sm text-muted">—</p>}
      </div>
      <select
        className="sheet-select mt-2"
        defaultValue=""
        onChange={(e) => {
          const lang = e.target.value;
          if (!lang || languages.includes(lang)) return;
          onChange({
            ...character,
            proficiencies: {
              ...character.proficiencies,
              languages: [...languages, lang],
            },
          });
          e.target.value = "";
        }}
      >
        <option value="">Añadir idioma…</option>
        {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
