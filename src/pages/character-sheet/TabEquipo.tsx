import { useState } from "react";
import { Button } from "@/components/layout";
import { calcularClaseArmadura } from "@/rules/combat";
import {
  ataqueDesdeItem,
  inventarioItemDesdeArma,
  MAGIC_BONUS_OPTIONS,
} from "@/rules/attacks";
import {
  capacidadCarga,
  estadoCarga,
  etiquetaEstadoCarga,
  MAX_SINTONIZACION,
  pesoTotalInventario,
  puedeSintonizar,
} from "@/rules/inventory";
import { srdArmor, srdWeapons, t, WEAPON_CATEGORY_LABELS } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import type { EquipmentItem } from "@/schemas/character";

const ARMOR_OPTIONS = srdArmor.filter((item) => item.category !== "shield");

export function TabEquipo({ character, onChange }: SheetTabProps) {
  const [weaponPick, setWeaponPick] = useState("");
  const [magicPick, setMagicPick] = useState(0);
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
  const pesoTotal = pesoTotalInventario(
    character.equipment.items,
    character.equipment.currency,
  );
  const sintonizados = character.equipment.items.filter((i) => i.attuned).length;
  const capacidad = capacidadCarga(character.abilities.str);
  const carga = estadoCarga(character.abilities.str, pesoTotal);

  function actualizarItem(index: number, partial: Partial<EquipmentItem>) {
    const items = character.equipment.items.map((item, i) =>
      i === index ? { ...item, ...partial } : item,
    );
    onChange({ ...character, equipment: { ...character.equipment, items } });
  }

  function eliminarItem(index: number) {
    onChange({
      ...character,
      equipment: {
        ...character.equipment,
        items: character.equipment.items.filter((_, i) => i !== index),
      },
    });
  }

  function agregarItem() {
    const item: EquipmentItem = {
      id: crypto.randomUUID(),
      name: "",
      qty: 1,
      weightLb: 0,
    };
    onChange({
      ...character,
      equipment: { ...character.equipment, items: [...character.equipment.items, item] },
    });
  }

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
    <div className="sheet-card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Armadura</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.equipment.armorId ?? ""}
            onChange={(e) =>
              onChange({
                ...character,
                equipment: { ...character.equipment, armorId: e.target.value || null },
              })
            }
          >
            <option value="">Sin armadura</option>
            {ARMOR_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {t("armor", item.id, item.nameEn)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input
            type="checkbox"
            checked={character.equipment.shieldEquipped}
            onChange={(e) =>
              onChange({
                ...character,
                equipment: { ...character.equipment, shieldEquipped: e.target.checked },
              })
            }
          />
          Escudo (+2)
        </label>
      </div>
      <p className="text-sm">
        CA calculada: {ca} · Sintonización: {sintonizados}/{MAX_SINTONIZACION}
      </p>

      <div className="flex flex-wrap gap-2">
        {(["pp", "gp", "ep", "sp", "cp"] as const).map((key) => (
          <label key={key} className="block text-xs">
            <span className="text-muted uppercase">{key}</span>
            <input
              type="number"
              min={0}
              className="mt-0.5 w-[4.25rem] rounded border border-white/10 bg-surface px-1.5 py-0.5 text-sm tabular-nums"
              value={character.equipment.currency[key]}
              onChange={(e) =>
                onChange({
                  ...character,
                  equipment: {
                    ...character.equipment,
                    currency: {
                      ...character.equipment.currency,
                      [key]: Math.max(0, Number(e.target.value) || 0),
                    },
                  },
                })
              }
            />
          </label>
        ))}
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Override CA manual</span>
        <input
          type="number"
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
          value={character.combat.armorClassOverride ?? ""}
          placeholder="Automática"
          onChange={(e) =>
            onChange({
              ...character,
              combat: {
                ...character.combat,
                armorClassOverride: e.target.value ? Number(e.target.value) : null,
              },
            })
          }
        />
      </label>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Inventario</h3>
          <p
            className={`text-sm ${carga === "sobrecarga" ? "text-red-400" : "text-muted"}`}
          >
            {pesoTotal.toFixed(1)} / {capacidad} lb · {etiquetaEstadoCarga(carga)}
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg bg-surface p-3">
          <label className="block min-w-[12rem] flex-1 text-sm">
            <span className="text-muted">Añadir arma SRD</span>
            <select
              className="mt-1 w-full rounded border border-white/10 bg-panel px-2 py-1"
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
          </label>
          <label className="block text-sm">
            <span className="text-muted">Mejora</span>
            <select
              className="mt-1 block rounded border border-white/10 bg-panel px-2 py-1"
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

        <div className="hidden gap-x-2 px-2 text-[11px] text-muted lg:grid lg:grid-cols-[minmax(0,1fr)_7rem_minmax(5rem,0.6fr)_auto_1.5rem]">
          <span>Objeto</span>
          <span>Cant. / lb/u</span>
          <span>Notas</span>
          <span>Sinton.</span>
          <span />
        </div>
        <div className="space-y-1">
          {character.equipment.items.map((item, index) => {
            const attack = ataqueDesdeItem(item, character);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_1.5rem] items-center gap-x-2 gap-y-1 rounded border border-white/10 bg-surface px-2 py-1.5 text-xs lg:grid-cols-[minmax(0,1fr)_7rem_minmax(5rem,0.6fr)_auto_1.5rem]"
              >
                <div className="col-span-2 flex min-w-0 items-center gap-1.5 lg:col-span-1">
                  <input
                    className="min-w-0 flex-1 rounded border border-white/10 bg-panel px-1.5 py-0.5 text-xs"
                    placeholder="Nombre"
                    value={item.name}
                    onChange={(e) => actualizarItem(index, { name: e.target.value })}
                  />
                  {attack?.damage && (
                    <span className="hidden shrink-0 text-[10px] text-muted sm:inline">
                      {attack.damage}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="flex items-center gap-0.5">
                    <span className="text-muted">#</span>
                    <input
                      type="number"
                      min={0}
                      className="w-9 rounded border border-white/10 bg-panel px-1 py-0.5 text-xs tabular-nums"
                      aria-label="Cantidad"
                      value={item.qty}
                      onChange={(e) =>
                        actualizarItem(index, { qty: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </label>
                  <label className="flex items-center gap-0.5">
                    <span className="text-muted">lb</span>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-10 rounded border border-white/10 bg-panel px-1 py-0.5 text-xs tabular-nums"
                      aria-label="Peso en libras por unidad"
                      value={item.weightLb}
                      onChange={(e) =>
                        actualizarItem(index, {
                          weightLb: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                </div>
                <input
                  className="col-span-2 min-w-0 rounded border border-white/10 bg-panel px-1.5 py-0.5 text-xs lg:col-span-1"
                  placeholder="Notas"
                  value={item.notes ?? ""}
                  onChange={(e) => actualizarItem(index, { notes: e.target.value || undefined })}
                />
                <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 lg:col-span-1">
                  <label className="flex items-center gap-0.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="size-3"
                      checked={item.requiresAttunement ?? false}
                      onChange={(e) =>
                        actualizarItem(index, {
                          requiresAttunement: e.target.checked,
                          attuned: e.target.checked ? item.attuned : false,
                        })
                      }
                    />
                    Req.
                  </label>
                  {item.requiresAttunement && (
                    <label className="flex items-center gap-0.5 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="size-3"
                        checked={item.attuned ?? false}
                        disabled={
                          !item.attuned && !puedeSintonizar(character.equipment.items, item.id)
                        }
                        onChange={(e) => actualizarItem(index, { attuned: e.target.checked })}
                      />
                      Activo
                    </label>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="col-start-3 row-start-1 px-1 py-0 text-xs lg:col-start-5"
                  aria-label="Eliminar objeto"
                  onClick={() => eliminarItem(index)}
                >
                  ✕
                </Button>
              </div>
            );
          })}
        </div>

        <Button className="mt-3" onClick={agregarItem}>
          Añadir objeto
        </Button>
      </div>
    </div>
  );
}
