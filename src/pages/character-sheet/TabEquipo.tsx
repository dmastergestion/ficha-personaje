import { ArmorInfoPanel } from "@/components/ArmorInfoPanel";
import { InfoTrigger } from "@/components/InfoTrigger";
import { WeaponInfoPanel } from "@/components/WeaponInfoPanel";
import { Button } from "@/components/layout";
import { infoArmaduraPorId } from "@/rules/armor-text";
import { infoArmaPorId } from "@/rules/weapon-text";
import {
  ataqueDesdeItem,
  alternarEnCombate,
  esItemAtacable,
  itemEnCombate,
} from "@/rules/attacks";
import {
  capacidadCarga,
  estadoCarga,
  etiquetaEstadoCarga,
  MAX_SINTONIZACION,
  pesoItem,
  pesoTotalInventario,
  puedeSintonizar,
} from "@/rules/inventory";
import { srdArmor, t } from "@/rules/srd";
import { DAMAGE_TYPES } from "@/lib/constants";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import type { EquipmentItem } from "@/schemas/character";
import { useMemo } from "react";

const ARMOR_OPTIONS = srdArmor.filter((item) => item.category !== "shield");

const MONEDAS = [
  { key: "pp" as const, label: "Pt", title: "Platino" },
  { key: "gp" as const, label: "Oro", title: "Oro" },
  { key: "ep" as const, label: "El", title: "Electrum" },
  { key: "sp" as const, label: "Pl", title: "Plata" },
  { key: "cp" as const, label: "Co", title: "Cobre" },
];

export function TabEquipo({ character, onChange }: SheetTabProps) {
  const pesoTotal = pesoTotalInventario(
    character.equipment.items,
    character.equipment.currency,
  );
  const sintonizados = character.equipment.items.filter((i) => i.attuned).length;
  const capacidad = capacidadCarga(character.abilities.str);
  const carga = estadoCarga(character.abilities.str, pesoTotal);
  const pesoKg = pesoTotal * 0.453592;
  const capacidadKg = capacidad * 0.453592;

  const filas = useMemo(
    () =>
      character.equipment.items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const aArma = esItemAtacable(a.item) ? 0 : 1;
          const bArma = esItemAtacable(b.item) ? 0 : 1;
          if (aArma !== bArma) return aArma - bArma;
          const aMag = a.item.requiresAttunement || a.item.attuned ? 0 : 1;
          const bMag = b.item.requiresAttunement || b.item.attuned ? 0 : 1;
          if (aMag !== bMag) return aMag - bMag;
          return a.item.name.localeCompare(b.item.name, "es", { sensitivity: "base" });
        }),
    [character.equipment.items],
  );

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

  const infoArmadura = infoArmaduraPorId(character.equipment.armorId);

  return (
    <div className="sheet-tab-stack">
      <section className="sheet-card">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <label className="block min-w-[12rem] max-w-xs flex-1 space-y-1 text-sm">
            <span className="sheet-field-label">Armadura</span>
            <div className="flex gap-1">
              <select
                className="sheet-select min-w-0 flex-1"
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
          <label className="block w-28 shrink-0 space-y-1 text-sm">
            <span className="sheet-field-label">CA manual</span>
            <input
              type="number"
              className="sheet-input"
              value={character.combat.armorClassOverride ?? ""}
              placeholder="Auto"
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
          <label className="flex shrink-0 items-center gap-2 pb-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-gold"
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
          <div className="ml-auto flex flex-wrap gap-2">
            {MONEDAS.map(({ key, label, title }) => (
              <label key={key} className="block w-[4.25rem] text-sm" title={title}>
                <span className="sheet-field-label">{label}</span>
                <input
                  type="number"
                  min={0}
                  aria-label={title}
                  className="sheet-input-sm"
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
        </div>
      </section>

      <section className="sheet-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="sheet-section-title mb-0">Inventario</h3>
            <span
              className={`text-sm ${sintonizados >= MAX_SINTONIZACION ? "text-amber-300" : "text-muted"}`}
            >
              Sintonización {sintonizados}/{MAX_SINTONIZACION}
            </span>
          </div>
          <p
            className={`text-sm ${carga === "sobrecarga" ? "text-danger" : "text-muted"}`}
          >
            {pesoTotal.toFixed(1)} / {capacidad} lb ({pesoKg.toFixed(1)} / {capacidadKg.toFixed(1)}{" "}
            kg) · {etiquetaEstadoCarga(carga)}
          </p>
        </div>

        {character.equipment.items.length === 0 ? (
          <p className="text-sm text-muted">Sin objetos. Añade uno o un arma SRD en Información.</p>
        ) : (
          <div className="sheet-equip-grid">
            {filas.map(({ item, index }) => {
              const attack = ataqueDesdeItem(item, character);
              const weaponInfo = infoArmaPorId(item.weaponId);
              const atacable = esItemAtacable(item);
              const enCombate = itemEnCombate(item);
              const totalLinea = pesoItem(item);
              const sintonizado = !!item.attuned;

              return (
                <article
                  key={item.id}
                  className={`sheet-equip-item ${
                    sintonizado
                      ? "sheet-equip-item-attuned"
                      : atacable && enCombate
                        ? "sheet-equip-item-weapon"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <input
                      className="sheet-input-sm min-w-0 flex-1 py-1 text-sm font-semibold"
                      placeholder="Objeto…"
                      aria-label="Nombre del objeto"
                      value={item.name}
                      onChange={(e) => actualizarItem(index, { name: e.target.value })}
                    />
                    {weaponInfo ? (
                      <InfoTrigger
                        tip={weaponInfo.tip}
                        title={weaponInfo.name}
                        panel={<WeaponInfoPanel weapon={weaponInfo.weapon} />}
                        className="h-7 w-7 shrink-0 rounded-md border border-white/10 bg-panel text-xs"
                      />
                    ) : null}
                    <Button
                      variant="ghost"
                      className="h-7 w-7 shrink-0 p-0 text-muted"
                      aria-label="Quitar objeto"
                      onClick={() => eliminarItem(index)}
                    >
                      ✕
                    </Button>
                  </div>

                  {(atacable || attack?.damage || (item.magicBonus ?? 0) > 0) && (
                    <p className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted">
                      {atacable && enCombate && (
                        <span className="rounded bg-gold/15 px-1 py-0.5 font-medium text-gold">
                          Combate
                        </span>
                      )}
                      {(item.magicBonus ?? 0) > 0 && (
                        <span className="text-accent">+{item.magicBonus}</span>
                      )}
                      {attack?.damage && <span>{attack.damage}</span>}
                    </p>
                  )}

                  <div className="sheet-equip-metrics">
                    <label>
                      Cant.
                      <input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) =>
                          actualizarItem(index, {
                            qty: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                    <label>
                      lb/u
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        title="Peso por unidad (lb)"
                        value={item.weightLb}
                        onChange={(e) =>
                          actualizarItem(index, {
                            weightLb: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                    <span className="tabular-nums" title="Cantidad × peso">
                      Σ {totalLinea.toFixed(1)} lb
                    </span>
                  </div>

                  <textarea
                    className="sheet-input-sm min-h-[2rem] w-full resize-y py-1 text-xs leading-snug"
                    rows={1}
                    placeholder="Notas…"
                    aria-label="Notas del objeto"
                    value={item.notes ?? ""}
                    onChange={(e) =>
                      actualizarItem(index, { notes: e.target.value || undefined })
                    }
                  />

                  <div className="flex flex-wrap items-center gap-1">
                    {atacable && (
                      <Button
                        variant={enCombate ? "primary" : "default"}
                        className="px-2 py-0.5 text-[11px]"
                        title="Incluir en la pestaña Combate (puedes marcar varias)"
                        onClick={() => onChange(alternarEnCombate(character, item.id))}
                      >
                        {enCombate ? "En combate" : "Combate"}
                      </Button>
                    )}
                    <label
                      className={`flex cursor-pointer items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${
                        sintonizado
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-white/10 text-muted"
                      }`}
                      title="Sintonizado (máx. 3)"
                    >
                      <input
                        type="checkbox"
                        className="size-3 accent-gold"
                        aria-label="Sintonizado"
                        checked={sintonizado}
                        disabled={
                          !sintonizado &&
                          !puedeSintonizar(character.equipment.items, item.id)
                        }
                        onChange={(e) =>
                          actualizarItem(index, {
                            attuned: e.target.checked,
                            requiresAttunement: e.target.checked
                              ? true
                              : item.requiresAttunement,
                          })
                        }
                      />
                      Sint
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-muted">
                      CA
                      <select
                        className="sheet-input-sm w-12 py-0.5 text-[11px]"
                        aria-label="Bonificador de CA del objeto"
                        value={item.acBonus ?? 0}
                        onChange={(e) =>
                          actualizarItem(index, {
                            acBonus: Math.min(3, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                      >
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            +{n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <select
                      className="sheet-input-sm max-w-[9rem] py-0.5 text-[11px]"
                      aria-label="Resistencia que otorga el objeto"
                      value=""
                      onChange={(e) => {
                        const tipo = e.target.value;
                        if (!tipo) return;
                        const actuales = item.grantedResistances ?? [];
                        if (actuales.some((t) => t.toLowerCase() === tipo.toLowerCase())) return;
                        actualizarItem(index, { grantedResistances: [...actuales, tipo] });
                      }}
                    >
                      <option value="">+ Resistencia…</option>
                      {DAMAGE_TYPES.filter(
                        (t) =>
                          !(item.grantedResistances ?? []).some(
                            (g) => g.toLowerCase() === t.toLowerCase(),
                          ),
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {(item.grantedResistances ?? []).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        className="rounded bg-gold/15 px-1.5 py-0.5 text-[11px] text-gold"
                        onClick={() =>
                          actualizarItem(index, {
                            grantedResistances: (item.grantedResistances ?? []).filter(
                              (t) => t !== tipo,
                            ),
                          })
                        }
                      >
                        {tipo} ×
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Button className="mt-3" onClick={agregarItem}>
          Añadir objeto
        </Button>
        <p className="mt-2 text-sm text-muted">
          Puedes marcar varias armas como «En combate». Las del catálogo SRD se añaden en
          Información.
        </p>
      </section>
    </div>
  );
}
