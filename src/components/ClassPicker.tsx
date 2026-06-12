import { SheetLabel } from "@/components/sheet-ui";
import type { GameCatalog } from "@/rules/catalog";

export function ClassPicker({
  catalog,
  classId,
  onChange,
  className = "sheet-select",
  compact = false,
}: {
  catalog: GameCatalog;
  classId: string;
  onChange: (classId: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const select = (
    <select className={className} value={classId} onChange={(e) => onChange(e.target.value)}>
      {catalog.classes.map((c) => (
        <option key={c.id} value={c.id}>
          {catalog.t("classes", c.id, c.nameEn)}
        </option>
      ))}
    </select>
  );

  if (compact) {
    return (
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="shrink-0 text-muted whitespace-nowrap">Clase</span>
        {select}
      </label>
    );
  }

  return (
    <label className="block">
      <SheetLabel>Clase</SheetLabel>
      {select}
    </label>
  );
}
