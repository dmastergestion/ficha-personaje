import { filasInfoArma } from "@/rules/weapon-text";
import type { SrdWeapon } from "@/rules/srd";

export function WeaponInfoPanel({ weapon }: { weapon: SrdWeapon }) {
  const rows = filasInfoArma(weapon);

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
