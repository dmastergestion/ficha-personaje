import { Button } from "@/components/layout";
import {
  eleccionesClase,
  fusionarEleccionesClase,
  type OpcionesEleccionClase,
} from "@/rules/class-equipment";
import {
  esEleccionEditable,
  type OriginChoiceDefinition,
  type OriginChoices,
} from "@/rules/origin-choices";
import { eleccionesConjurosClase, claseTieneEleccionesConjuro } from "@/rules/spell-grants";
import type { GameCatalog } from "@/rules/catalog";
import {
  alternarInvocacion,
  invocacionPorId,
  INVOCATIONS_KEY,
  KEYS_SEGUIMIENTO_INVOCACION,
  parsearInvocaciones,
} from "@/rules/invocations";
import type { ClassLevel } from "@/schemas/character";

export function ClassChoicesForm({
  classId,
  classes,
  level,
  choices,
  catalog,
  onChange,
  mode = "sheet",
  omitirEquipo = false,
  vista = "completa",
  trucosConocidos = [],
}: {
  classId: string;
  classes: ClassLevel[];
  level: number;
  choices: OriginChoices;
  catalog?: GameCatalog;
  onChange: (next: OriginChoices) => void;
  mode?: "create" | "sheet";
  omitirEquipo?: boolean;
  /** `uso`: solo lo elegido. `catalogo`: solo lo que aún no tienes. */
  vista?: "completa" | "uso" | "catalogo";
  trucosConocidos?: string[];
}) {
  const opts: OpcionesEleccionClase = {
    classes,
    classLevel: level,
    invocaciones: choices.class[INVOCATIONS_KEY],
    trucosConocidos,
  };
  const spellOptions =
    catalog && claseTieneEleccionesConjuro(classId, classes)
      ? catalog.spells.map((s) => ({
          id: s.id,
          level: s.level,
          name: catalog.t("spells", s.id, s.nameEn),
        }))
      : [];
  const defs = [
    ...eleccionesClase(classId, opts),
    ...eleccionesConjurosClase(classId, classes, spellOptions),
  ].filter((def) => !omitirEquipo || def.id !== "equipment");
  const defsVista = defs.filter((def) => {
    if (vista === "completa") return true;
    if (def.kind === "multi") {
      const n = parsearInvocaciones(choices.class[def.id]).length;
      if (vista === "uso") return n > 0;
      return n < (def.maxSelections ?? 0);
    }
    const valor = choices.class[def.id];
    const asignado = Boolean(valor);
    if (KEYS_SEGUIMIENTO_INVOCACION.has(def.id)) {
      return vista === "uso" && asignado;
    }
    return vista === "uso" ? asignado : !asignado;
  });
  if (defsVista.length === 0) return null;

  function setClass(id: string, value: string) {
    const next = { ...choices, class: { ...choices.class, [id]: value } };
    if (id === INVOCATIONS_KEY) {
      onChange(fusionarEleccionesClase(classId, next, opts));
      return;
    }
    onChange(next);
  }

  return (
    <div className="sheet-card flex flex-col gap-4">
      <h3 className="sheet-section-title mb-0">
        {vista === "catalogo" ? "Opciones de clase por elegir" : "Elecciones de clase"}
      </h3>
      {defsVista.map((def) => {
        const disabled = mode === "sheet" && !esEleccionEditable(def, level);
        if (def.kind === "multi") {
          return (
            <MultiChoice
              key={def.id}
              def={def}
              value={choices.class[def.id]}
              disabled={disabled}
              classLevel={level}
              vista={vista}
              onChange={(next) => setClass(def.id, next)}
            />
          );
        }

        return (
          <label key={def.id} className="block space-y-1 text-sm">
            <span className="text-muted">{def.label}</span>
            {def.hint && <p className="text-xs text-muted/80">{def.hint}</p>}
            <select
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 disabled:opacity-60"
              value={choices.class[def.id] ?? def.defaultValue ?? def.options[0]?.value ?? ""}
              disabled={disabled}
              onChange={(e) => setClass(def.id, e.target.value)}
            >
              {def.options.map((opt) => (
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

function MultiChoice({
  def,
  value,
  disabled,
  classLevel,
  vista,
  onChange,
}: {
  def: OriginChoiceDefinition;
  value: string | undefined;
  disabled: boolean;
  classLevel: number;
  vista: "completa" | "uso" | "catalogo";
  onChange: (next: string) => void;
}) {
  const seleccionadas = new Set(parsearInvocaciones(value));
  const max = def.maxSelections ?? 0;
  const elegidas = def.options.filter((opt) => seleccionadas.has(opt.value));
  const disponibles = def.options.filter((opt) => !seleccionadas.has(opt.value));

  function alternar(optValue: string) {
    if (def.id === INVOCATIONS_KEY) {
      onChange(alternarInvocacion(classLevel, value, optValue));
      return;
    }
    const next = new Set(seleccionadas);
    if (next.has(optValue)) next.delete(optValue);
    else if (next.size < max) next.add(optValue);
    onChange([...next].join(","));
  }

  function fila(opt: (typeof def.options)[number]) {
    const checked = seleccionadas.has(opt.value);
    const inv = def.id === INVOCATIONS_KEY ? invocacionPorId(opt.value) : undefined;
    const faltaPrereq = (inv?.requires ?? []).some((req) => !seleccionadas.has(req));
    const bloqueado = disabled || faltaPrereq || (!checked && seleccionadas.size >= max);
    const detalle = (
      <span className="min-w-0 flex-1 text-sm leading-snug">
        <span className="font-medium">{opt.label}</span>
        {inv?.hint && (
          <span className="mt-0.5 block text-sm text-muted">{inv.hint}</span>
        )}
        {faltaPrereq && inv?.requires && (
          <span className="mt-0.5 block text-sm text-amber-400/90">
            Requiere: {inv.requires.map((id) => invocacionPorId(id)?.nameEs ?? id).join(", ")}
          </span>
        )}
      </span>
    );
    if (vista === "catalogo") {
      return (
        <li key={opt.value} className="flex items-start gap-2 border-b border-white/5 py-2.5 last:border-0">
          {detalle}
          <Button className="shrink-0" disabled={bloqueado} onClick={() => alternar(opt.value)}>
            Añadir
          </Button>
        </li>
      );
    }
    return (
      <li key={opt.value}>
        <label
          className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 ${
            bloqueado && !checked ? "opacity-50" : ""
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 size-4 accent-gold"
            checked={checked}
            disabled={bloqueado && !checked}
            onChange={() => alternar(opt.value)}
          />
          {detalle}
        </label>
      </li>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <span className="text-muted">{def.label}</span>
        {def.hint && <p className="text-xs text-muted/80">{def.hint}</p>}
        <p className="text-xs tabular-nums text-muted">
          {seleccionadas.size}/{max} elegidas
        </p>
      </div>
      {vista !== "catalogo" && elegidas.length > 0 && (
        <div>
          {vista !== "uso" && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Elegidas</p>
          )}
          <ul className="space-y-1 rounded-lg border border-white/10 bg-surface/40 p-1">
            {elegidas.map(fila)}
          </ul>
        </div>
      )}
      {vista !== "uso" && (
      <div>
        {vista !== "catalogo" && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Añadir
          </p>
        )}
        <ul className="max-h-80 space-y-0 overflow-y-auto rounded-lg border border-white/10 bg-surface/40 px-2">
          {disponibles.length === 0 ? (
            <li className="px-1.5 py-1.5 text-sm text-muted">No quedan opciones disponibles.</li>
          ) : (
            disponibles.map(fila)
          )}
        </ul>
      </div>
      )}
    </div>
  );
}
