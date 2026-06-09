import { SheetLabel } from "@/components/sheet-ui";
import type { GameCatalog } from "@/rules/catalog";

export function ClassPicker({
  catalog,
  classId,
  onChange,
  className = "sheet-select",
}: {
  catalog: GameCatalog;
  classId: string;
  onChange: (classId: string) => void;
  className?: string;
}) {
  return (
    <label className="block">
      <SheetLabel>Clase</SheetLabel>
      <select className={className} value={classId} onChange={(e) => onChange(e.target.value)}>
        {catalog.classes.map((c) => (
          <option key={c.id} value={c.id}>
            {catalog.t("classes", c.id, c.nameEn)}
          </option>
        ))}
      </select>
    </label>
  );
}
