import { useState } from "react";
import { InfoTrigger } from "@/components/InfoTrigger";
import { WeaponInfoPanel } from "@/components/WeaponInfoPanel";
import { Button } from "@/components/layout";
import { inventarioItemDesdeArma, MAGIC_BONUS_OPTIONS } from "@/rules/attacks";
import { infoArmaPorId } from "@/rules/weapon-text";
import { srdWeapons, t, WEAPON_CATEGORY_LABELS } from "@/rules/srd";
import type { Character } from "@/schemas/character";

export function AddWeaponPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const [weaponPick, setWeaponPick] = useState("");
  const [magicPick, setMagicPick] = useState(0);
  const infoArmaElegida = infoArmaPorId(weaponPick);
  const armasPorCategoria = Object.entries(WEAPON_CATEGORY_LABELS).map(([category, label]) => ({
    category,
    label,
    weapons: srdWeapons.filter((w) => w.category === category),
  }));

  function agregarArmaInventario() {
    if (!weaponPick) return;
    const item = inventarioItemDesdeArma(weaponPick, magicPick);
    if (!item) return;
    onChange({
      ...character,
      equipment: { ...character.equipment, items: [...character.equipment.items, item] },
    });
    setWeaponPick("");
  }

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Añadir arma SRD</h3>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[12rem] flex-1 text-sm">
          <span className="text-muted">Arma</span>
          <div className="mt-1 flex gap-1">
            <select
              className="sheet-select min-w-0 flex-1"
              value={weaponPick}
              onChange={(e) => setWeaponPick(e.target.value)}
            >
              <option value="">Elegir arma…</option>
              {armasPorCategoria.map(
                (group) =>
                  group.weapons.length > 0 && (
                    <optgroup key={group.category} label={group.label}>
                      {group.weapons.map((weapon) => (
                        <option key={weapon.id} value={weapon.id}>
                          {t("weapons", weapon.id, weapon.nameEn)} ({weapon.damageDie})
                        </option>
                      ))}
                    </optgroup>
                  ),
              )}
            </select>
            {infoArmaElegida && (
              <InfoTrigger
                tip={infoArmaElegida.tip}
                title={infoArmaElegida.name}
                panel={<WeaponInfoPanel weapon={infoArmaElegida.weapon} />}
                className="h-[42px] w-10 shrink-0 rounded-lg border border-white/10 bg-panel"
              />
            )}
          </div>
        </label>
        <label className="block w-24 shrink-0 text-sm">
          <span className="text-muted">Mejora</span>
          <select
            className="sheet-select mt-1"
            value={magicPick}
            onChange={(e) => setMagicPick(Number(e.target.value))}
          >
            {MAGIC_BONUS_OPTIONS.map((bonus) => (
              <option key={bonus} value={bonus}>
                {bonus === 0 ? "+0" : `+${bonus}`}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={agregarArmaInventario} disabled={!weaponPick}>
          Añadir al inventario
        </Button>
      </div>
    </section>
  );
}
