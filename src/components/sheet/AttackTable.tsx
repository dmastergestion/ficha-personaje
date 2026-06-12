import { Button } from "@/components/layout";
import { InfoTrigger } from "@/components/InfoTrigger";
import { WeaponInfoPanel } from "@/components/WeaponInfoPanel";
import { cn } from "@/lib/utils";
import {
  idAtaqueDefecto,
  listarAtaquesFicha,
  marcarAtaqueDefecto,
  modificadorAtaque,
} from "@/rules/attacks";
import { infoArmaPorId } from "@/rules/weapon-text";
import type { Character } from "@/schemas/character";

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

export function AttackTable({
  character,
  onChange,
  onAttack,
  selectedId,
  onSelect,
}: {
  character: Character;
  onChange: (next: Character) => void;
  onAttack: (attackId: string) => void;
  selectedId: string;
  onSelect: (attackId: string) => void;
}) {
  const rows = listarAtaquesFicha(character);
  const defaultId = idAtaqueDefecto(character);

  return (
    <div className="min-w-0">
      <div
        className="sheet-table-header sheet-attack-grid text-[10px] leading-tight"
        aria-hidden
      >
        <span>Nombre</span>
        <span className="text-center">Bonif.</span>
        <span>Daño</span>
        <span>Notas</span>
      </div>
      <ul>
        {rows.map(({ id, attack }) => {
          const mod = modificadorAtaque(character, attack);
          const isDefault = defaultId === id;
          const isSelected = selectedId === id;
          const weaponInfo = infoArmaPorId(attack.weaponId);
          return (
            <li
              key={id}
              className={cn(
                "sheet-table-row sheet-attack-grid items-center",
                isSelected && "bg-gold/5",
              )}
            >
              <div className="flex min-w-0 items-center gap-0.5">
                <button
                  type="button"
                  className="min-w-0 truncate text-left hover:text-gold"
                  onClick={() => onSelect(id)}
                >
                  {attack.name}
                  {isDefault ? " ★" : ""}
                </button>
                {weaponInfo && (
                  <InfoTrigger
                    tip={weaponInfo.tip}
                    title={weaponInfo.name}
                    panel={<WeaponInfoPanel weapon={weaponInfo.weapon} />}
                    className="h-5 w-5 shrink-0 text-[10px]"
                  />
                )}
              </div>
              <Button
                variant="combat"
                className="shrink-0 px-1.5 py-0.5 text-xs tabular-nums"
                onClick={() => {
                  onSelect(id);
                  onAttack(id);
                }}
              >
                {fmtMod(mod)}
              </Button>
              <span className="min-w-0 truncate text-muted">{attack.damage || "—"}</span>
              <span className="min-w-0 truncate text-xs text-muted">{attack.notes || "—"}</span>
            </li>
          );
        })}
      </ul>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          className="size-3.5 accent-gold"
          checked={defaultId === selectedId}
          onChange={(e) => {
            if (e.target.checked) {
              onChange(marcarAtaqueDefecto(character, selectedId));
            } else {
              onChange(marcarAtaqueDefecto(character, null));
            }
          }}
        />
        Predeterminado
      </label>
    </div>
  );
}
