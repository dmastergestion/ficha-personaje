import type { OrigenCatalogo } from "@/rules/origin-benefits";
import {
  eleccionVisible,
  esEleccionBonificacionAtributos,
  esEleccionEditable,
  etiquetaEleccionOrigen,
  opcionesEleccionOrigen,
  todasEleccionesOrigen,
  type OriginChoiceDefinition,
  type OriginChoices,
} from "@/rules/origin-choices";

function CampoEleccion({
  def,
  value,
  disabled,
  options,
  onChange,
}: {
  def: OriginChoiceDefinition;
  value: string;
  disabled: boolean;
  options: OriginChoiceDefinition["options"];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{def.label}</span>
      {def.hint && <p className="text-xs text-muted/80">{def.hint}</p>}
      <select
        className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 disabled:opacity-60"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Elige —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {disabled && value && (
        <p className="text-xs text-muted">
          Fijado: {etiquetaEleccionOrigen(def, value)}
        </p>
      )}
    </label>
  );
}

export function OriginChoicesForm({
  speciesId,
  backgroundId,
  level,
  catalogo,
  choices,
  onChange,
  mode = "create",
  omitirBonificacionAtributos = false,
}: {
  speciesId: string | null;
  backgroundId: string | null;
  level: number;
  catalogo?: OrigenCatalogo;
  choices: OriginChoices;
  onChange: (next: OriginChoices) => void;
  mode?: "create" | "sheet";
  /** En creación, la bonificación de atributos se elige en el paso Atributos. */
  omitirBonificacionAtributos?: boolean;
}) {
  const defs = todasEleccionesOrigen(speciesId, backgroundId, catalogo).filter(
    (d) => !omitirBonificacionAtributos || !esEleccionBonificacionAtributos(d.id),
  );
  if (!defs.length) return null;

  const speciesDefs = defs.filter((d) => d.scope === "species" && eleccionVisible(d, choices));
  const backgroundDefs = defs.filter((d) => d.scope === "background" && eleccionVisible(d, choices));

  function setSpecies(id: string, value: string) {
    onChange({ ...choices, species: { ...choices.species, [id]: value } });
  }

  function setBackground(id: string, value: string) {
    onChange({ ...choices, background: { ...choices.background, [id]: value } });
  }

  return (
    <div className="sheet-card flex flex-col gap-4">
      <h3 className="sheet-section-title mb-0">Elecciones de origen</h3>
      {mode === "create" && (
        <p className="text-xs text-muted">
          Revisa cada lista: idioma, dote Versátil, equipo A/B y herramientas no se eligen solas.
        </p>
      )}

      {speciesDefs.length > 0 && (
        <div className="space-y-3">
          {speciesDefs.map((def) => (
            <CampoEleccion
              key={def.id}
              def={def}
              value={choices.species[def.id] ?? def.defaultValue ?? ""}
              disabled={mode === "sheet" && !esEleccionEditable(def, level)}
              options={opcionesEleccionOrigen(def, choices, backgroundId, catalogo)}
              onChange={(v) => setSpecies(def.id, v)}
            />
          ))}
        </div>
      )}

      {backgroundDefs.length > 0 && (
        <div className="space-y-3">
          {backgroundDefs.map((def) => (
            <CampoEleccion
              key={def.id}
              def={def}
              value={choices.background[def.id] ?? def.defaultValue ?? ""}
              disabled={mode === "sheet" && !esEleccionEditable(def, level)}
              options={opcionesEleccionOrigen(def, choices, backgroundId, catalogo)}
              onChange={(v) => setBackground(def.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
