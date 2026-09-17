import { Button } from "@/components/layout";
import { InfoTrigger } from "@/components/InfoTrigger";
import { WeaponInfoPanel } from "@/components/WeaponInfoPanel";
import { cn } from "@/lib/utils";
import {
  etiquetaDañoAtaque,
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
                "sheet-table-row sheet-attack-grid items-center py-2",
                isSelected && "bg-accent/5",
              )}
            >
              <div className="flex min-w-0 items-center gap-0.5">
                <button
                  type="button"
                  className="min-w-0 truncate text-left hover:text-accent"
                  onClick={() => onSelect(id)}
                >
                  {attack.name}
                </button>
                <button
                  type="button"
                  className="shrink-0 px-0.5 text-sm text-muted hover:text-accent"
                  title={isDefault ? "Ataque predeterminado" : "Usar este ataque en la barra"}
                  aria-label={
                    isDefault
                      ? `${attack.name}, predeterminado`
                      : `Marcar ${attack.name} como predeterminado`
                  }
                  aria-pressed={isDefault}
                  onClick={() =>
                    onChange(marcarAtaqueDefecto(character, isDefault ? null : id))
                  }
                >
                  {isDefault ? "★" : "☆"}
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
                variant="primary"
                className="min-h-10 min-w-10 shrink-0 px-2.5 py-2 text-sm tabular-nums"
                onClick={() => {
                  onSelect(id);
                  onAttack(id);
                }}
              >
                {fmtMod(mod)}
              </Button>
              <span className="min-w-0 truncate text-muted">
                {etiquetaDañoAtaque(character, attack)}
              </span>
              <span className="min-w-0 truncate text-xs text-muted">{attack.notes || "—"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
