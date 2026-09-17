import { SheetLabel } from "@/components/sheet-ui";
import { etiquetaSelectorSubclase, nivelSubclase } from "@/rules/class-features";
import {
  faltaElegirSubclase,
  puedeElegirSubclase,
  subclaseValidaParaClase,
} from "@/rules/multiclass";
import type { GameCatalog } from "@/rules/catalog";
import type { ClassLevel } from "@/schemas/character";

export function SubclassPicker({
  catalog,
  classLevel,
  subclassId,
  onChange,
  className = "sheet-select",
  compact = false,
  required = false,
  classLabel,
  disabled = false,
}: {
  catalog: GameCatalog;
  classLevel: ClassLevel;
  /** Valor controlado (p. ej. estado local del modal de subida). Si no se pasa, usa classLevel.subclassId. */
  subclassId?: string | null;
  onChange: (subclassId: string | null) => void;
  className?: string;
  compact?: boolean;
  required?: boolean;
  /** Etiqueta en modo compacto (p. ej. nombre de clase en multiclase). */
  classLabel?: string;
  disabled?: boolean;
}) {
  const tipoLabel = etiquetaSelectorSubclase(classLevel.classId);

  if (!required && !puedeElegirSubclase(classLevel)) return null;

  const options = catalog.subclasses.filter((sc) => sc.classId === classLevel.classId);
  const optionIds = new Set(options.map((o) => o.id));
  const rawValor =
    subclassId !== undefined ? (subclassId ?? "") : (classLevel.subclassId ?? "");
  const valorInvalido = rawValor !== "" && !optionIds.has(rawValor);
  const valor = optionIds.has(rawValor) ? rawValor : "";

  if (options.length === 0) {
    return (
      <p className="text-xs text-amber-300/90">
        No hay {tipoLabel.toLowerCase()}s en el catálogo para{" "}
        {catalog.t("classes", classLevel.classId, classLevel.classId)}.
      </p>
    );
  }

  const placeholder = required ? `— Elige ${tipoLabel.toLowerCase()} —` : `— Sin ${tipoLabel.toLowerCase()} —`;

  const select = (
    <select
      className={className}
      value={valor}
      disabled={disabled}
      required={required && !valor}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{placeholder}</option>
      {options.map((sc) => (
        <option key={sc.id} value={sc.id}>
          {catalog.t("subclasses", sc.id, sc.nameEn)}
        </option>
      ))}
    </select>
  );

  if (compact) {
    const compactLabel = classLabel
      ? `${classLabel}: ${tipoLabel}`
      : tipoLabel;
    return (
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="shrink-0 whitespace-nowrap text-muted">{compactLabel}</span>
        {select}
      </label>
    );
  }

  const subclaseInvalida =
    valorInvalido &&
    !subclaseValidaParaClase(classLevel.classId, rawValor);

  const sheetLabel = classLabel ? `${tipoLabel} (${classLabel})` : tipoLabel;

  return (
    <label className="block space-y-1 text-sm">
      <SheetLabel>{sheetLabel}</SheetLabel>
      {select}
      {subclaseInvalida && (
        <p className="text-xs text-amber-300/90">
          El {tipoLabel.toLowerCase()} guardado no coincide con el catálogo; elige uno de la lista.
        </p>
      )}
      {!required && faltaElegirSubclase(classLevel) && (
        <p className="text-xs text-muted">
          Obligatorio desde nivel {nivelSubclase(classLevel.classId)} de esta clase.
        </p>
      )}
    </label>
  );
}
