import { useState } from "react";
import { ArmorInfoPanel } from "@/components/ArmorInfoPanel";
import { InfoTrigger } from "@/components/InfoTrigger";
import { WeaponInfoPanel } from "@/components/WeaponInfoPanel";
import { Button } from "@/components/layout";
import { infoArmaduraPorId } from "@/rules/armor-text";
import { infoArmaPorId } from "@/rules/weapon-text";
import {
  ataqueDesdeItem,
  esItemAtacable,
  inventarioItemDesdeArma,
  marcarAtaqueDefecto,
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
  const pesoTotal = pesoTotalInventario(
    character.equipment.items,
    character.equipment.currency,
  );
  const sintonizados = character.equipment.items.filter((i) => i.attuned).length;
  const capacidad = capacidadCarga(character.abilities.str);
  const carga = estadoCarga(character.abilities.str, pesoTotal);
  const pesoKg = pesoTotal * 0.453592;
  const capacidadKg = capacidad * 0.453592;

  function actualizarItem(index: number, partial: Partial<EquipmentItem>) {
    const items = character.equipment.items.map((item, i) =>
      i === index ? { ...item, ...partial } : item,
    );
    onChange({ ...character, equipment: { ...character.equipment, items } });
  }

  function eliminarItem(index: number) {
    const removed = character.equipment.items[index];
    const nextItems = character.equipment.items.filter((_, i) => i !== index);
    const defaultAttackId =
      removed && character.equipment.defaultAttackId === removed.id
        ? null
        : character.equipment.defaultAttackId;
    onChange({
      ...character,
      equipment: {
        ...character.equipment,
        items: nextItems,
        defaultAttackId,
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

  const infoArmadura = infoArmaduraPorId(character.equipment.armorId);
  const infoArmaElegida = infoArmaPorId(weaponPick);

  return (
    <div className="sheet-card sheet-tab-stack">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <label className="block min-w-[12rem] max-w-xs flex-1 space-y-1 text-sm">
          <span className="text-muted">Armadura</span>
          <div className="flex gap-1">
            <select
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-surface px-3 py-2"
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
            {infoArmadura && (
              <InfoTrigger
                tip={infoArmadura.tip}
                title={infoArmadura.name}
                panel={<ArmorInfoPanel armor={infoArmadura.armor} />}
                className="h-[42px] w-10 shrink-0 rounded-lg border border-white/10 bg-surface"
              />
            )}
          </div>
        </label>
        <label className="block w-36 shrink-0 space-y-1 text-sm">
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
        <label className="flex shrink-0 items-center gap-2 pb-2 text-sm">
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

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-semibold">Inventario</h3>
            <span className="text-sm text-muted">
              Sintonización: {sintonizados}/{MAX_SINTONIZACION}
            </span>
          </div>
          <p
            className={`text-sm ${carga === "sobrecarga" ? "text-red-400" : "text-muted"}`}
          >
            {pesoTotal.toFixed(1)} / {capacidad} lb ({pesoKg.toFixed(1)} / {capacidadKg.toFixed(1)}{" "}
            kg) · {etiquetaEstadoCarga(carga)}
          </p>
        </div>

        <div className="mb-2 flex flex-wrap items-end gap-2 rounded-lg bg-surface p-2">
          <label className="block min-w-[12rem] flex-1 text-sm">
          <span className="text-muted">Añadir arma SRD</span>
          <div className="mt-1 flex gap-1">
            <select
              className="min-w-0 flex-1 rounded border border-white/10 bg-panel px-2 py-1"
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
                className="h-9 w-9 shrink-0 rounded border border-white/10 bg-panel"
              />
            )}
          </div>
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
            const weaponInfo = infoArmaPorId(item.weaponId);
            return (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 rounded border border-white/10 bg-surface px-2 py-1.5 text-xs lg:grid-cols-[minmax(0,1fr)_7rem_minmax(5rem,0.6fr)_auto_2rem]"
              >
                <div className="flex min-w-0 items-center gap-1 lg:col-start-1 lg:row-start-1">
                  <input
                    className="min-w-0 w-full flex-1 rounded border border-white/10 bg-panel px-1.5 py-0.5 text-xs"
                    placeholder="Nombre"
                    value={item.name}
                    onChange={(e) => actualizarItem(index, { name: e.target.value })}
                  />
                  {weaponInfo && (
                    <InfoTrigger
                      tip={weaponInfo.tip}
                      title={weaponInfo.name}
                      panel={<WeaponInfoPanel weapon={weaponInfo.weapon} />}
                      className="h-6 w-6 shrink-0 text-[10px]"
                    />
                  )}
                  {attack?.damage && (
                    <span className="hidden shrink-0 text-[10px] text-muted sm:inline">
                      {attack.damage}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="col-start-2 row-start-1 shrink-0 px-1 py-0 text-xs lg:col-start-5"
                  aria-label="Eliminar objeto"
                  onClick={() => eliminarItem(index)}
                >
                  ✕
                </Button>
                <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex-nowrap">
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
                  className="col-span-2 min-w-0 w-full rounded border border-white/10 bg-panel px-1.5 py-0.5 text-xs lg:col-span-1 lg:col-start-3 lg:row-start-1"
                  placeholder="Notas"
                  value={item.notes ?? ""}
                  onChange={(e) => actualizarItem(index, { notes: e.target.value || undefined })}
                />
                <div className="col-span-2 flex flex-wrap items-center gap-x-1.5 gap-y-0 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:flex-nowrap">
                  {esItemAtacable(item) && (
                    <Button
                      variant="ghost"
                      className={`h-7 w-7 shrink-0 p-0 text-base leading-none ${character.equipment.defaultAttackId === item.id ? "text-gold" : "text-muted"}`}
                      aria-label={
                        character.equipment.defaultAttackId === item.id
                          ? "Ataque predeterminado"
                          : "Marcar como ataque predeterminado"
                      }
                      title={
                        character.equipment.defaultAttackId === item.id
                          ? "Ataque predeterminado"
                          : "Marcar como ataque predeterminado"
                      }
                      onClick={() =>
                        onChange(
                          marcarAtaqueDefecto(
                            character,
                            character.equipment.defaultAttackId === item.id ? null : item.id,
                          ),
                        )
                      }
                    >
                      ★
                    </Button>
                  )}
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
              </div>
            );
          })}
        </div>

        <Button className="mt-2" onClick={agregarItem}>
          Añadir objeto
        </Button>
      </div>
    </div>
  );
}
