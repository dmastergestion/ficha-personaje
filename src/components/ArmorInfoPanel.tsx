import { filasInfoArmadura } from "@/rules/armor-text";
import type { SrdArmor } from "@/rules/srd";

export function ArmorInfoPanel({ armor }: { armor: SrdArmor }) {
  const rows = filasInfoArmadura(armor);

  return (
    <div className="text-sm">
      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
