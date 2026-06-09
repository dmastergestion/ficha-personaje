import { useState } from "react";
import { ConditionPanel } from "@/components/ConditionPanel";
import { DamageTypesEditor } from "@/components/DamageTypesEditor";
import { ResourcesPanel } from "@/components/ResourcesPanel";
import { Button } from "@/components/layout";
import { ABILITY_KEYS, DAMAGE_TYPES } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import {
  ABILITY_LABELS_ES,
  iniciativa,
  modificadorSalvacion,
  velocidad,
} from "@/rules/character";
import { modificadorAtributo } from "@/rules/ability";
import { calcularClaseArmadura } from "@/rules/combat";
import { aplicarCambioPv } from "@/rules/combat-hp";
import {
  registrarFalloSalvacionMuerte,
  resetearSalvacionesMuerte,
  tirarSalvacionMuerte,
} from "@/rules/death-saves";
import { tiradaConcentracionPorDanio } from "@/rules/concentration";
import { tiradaSalvacion } from "@/rules/effects";
import { parseTargetAc, tirarAtaqueCompleto } from "@/rules/attack-roll";
import {
  ataqueDesdeItem,
  esItemAtacable,
  GOLPE_DESARMADO,
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
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
  gastarDadoGolpe,
} from "@/rules/rests";
import { srdArmor, srdWeapons, t, WEAPON_CATEGORY_LABELS } from "@/rules/srd";
import { dadosGolpeDisponibles } from "@/rules/hit-dice";
import { dadosDeGolpePorClase } from "@/rules/multiclass";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import type { EquipmentItem } from "@/schemas/character";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

const ARMOR_OPTIONS = srdArmor.filter((item) => item.category !== "shield");

function toggleSalvacion(character: SheetTabProps["character"], key: AbilityKey) {
  const savingThrows = character.proficiencies.savingThrows.includes(key)
    ? character.proficiencies.savingThrows.filter((k) => k !== key)
    : [...character.proficiencies.savingThrows, key];
  return {
    ...character,
    proficiencies: { ...character.proficiencies, savingThrows },
  };
}

export function TabCombate({ character, onChange }: SheetTabProps) {
  const [customDelta, setCustomDelta] = useState("5");
  const [tipoDanio, setTipoDanio] = useState("");
  const [caObjetivo, setCaObjetivo] = useState("10");
  const [armaSeleccionada, setArmaSeleccionada] = useState("desarmado");
  const catalog = useCatalogStore((s) => s.catalog);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const speciesSpeed = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.speed
    : undefined;
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const setUltimoAtaque = useUiStore((s) => s.setUltimoAtaque);
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
  const armasInventario = character.equipment.items.filter(esItemAtacable);

  function cambiarPv(delta: number) {
    if (delta === 0) return;
    if (delta < 0 && !diceRoll.isReady && character.spells.concentratingOn) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }

    const prevHp = character.combat.hpCurrent;
    const combat = aplicarCambioPv(character.combat, delta, {
      damageType: tipoDanio || undefined,
    });
    let next: SheetTabProps["character"] = { ...character, combat };

    if (delta < 0 && prevHp === 0 && combat.hpCurrent === 0) {
      const fail = registrarFalloSalvacionMuerte(combat, 1);
      next = { ...next, combat: fail.combat };
      if (fail.outcome === "dead") {
        setUltimaTirada(null, "Tres fallos de salvación de muerte — personaje muerto.");
      }
    }

    if (delta < 0 && character.spells.concentratingOn) {
      const conc = tiradaConcentracionPorDanio(
        { ...character, combat },
        Math.abs(delta),
        rollMode,
        diceRoll.options,
      );
      if (conc) {
        next = conc.character;
        setUltimaTirada(
          conc.roll,
          conc.maintained
            ? `Concentración · CD ${conc.dc} · mantienes el conjuro`
            : `Concentración · CD ${conc.dc} · pierdes el conjuro`,
        );
      }
    }

    onChange(next);
  }

  function tirarSalvacionMuerteRoll() {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const result = tirarSalvacionMuerte(character, rollMode, diceRoll.options);
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    onChange(result.character);
    setUltimaTirada(result.roll, result.message);
  }

  function tirarSalvacionRoll(key: AbilityKey) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const mod = modificadorSalvacion(character, key);
    const result = tiradaSalvacion(
      mod,
      key,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      diceRoll.options,
    );
    if ("autoFallo" in result) {
      if (result.razon.includes("dado")) {
        setUltimaTirada(null, result.razon);
        return;
      }
      setUltimaTirada({
        mode: "normal",
        rolls: [1],
        used: 1,
        modifier: mod,
        total: 1 + mod,
        isCritical: false,
        isFumble: true,
        source: diceRoll.options.source ?? "virtual",
      });
      return;
    }
    setUltimaTirada(result);
  }

  function tirarAtaqueSeleccionado() {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const ac = parseTargetAc(caObjetivo);
    const attack =
      armaSeleccionada === "desarmado"
        ? GOLPE_DESARMADO
        : ataqueDesdeItem(
            armasInventario.find((i) => i.id === armaSeleccionada)!,
            character,
          );
    if (!attack) return;

    const result = tirarAtaqueCompleto(
      character,
      attack,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      ac,
      diceRoll.options,
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimoAtaque(result);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <section className="sheet-card lg:col-span-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-bold tabular-nums">
            PV {character.combat.hpCurrent}/{character.combat.hpMax}
            {character.combat.hpTemp > 0 && (
              <span className="text-accent"> ({character.combat.hpTemp})</span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="critical"
              className="px-2 py-1 text-xs"
              aria-label="Restar PV (daño)"
              onClick={() => cambiarPv(-Math.abs(Number(customDelta) || 1))}
            >
              −
            </Button>
            <input
              type="number"
              aria-label="Cantidad de PV a sumar o restar"
              className="w-12 rounded-lg border border-white/10 bg-surface px-1 py-1 text-xs"
              value={customDelta}
              onChange={(e) => setCustomDelta(e.target.value)}
            />
            <Button
              variant="critical"
              className="px-2 py-1 text-xs"
              aria-label="Sumar PV (curación)"
              onClick={() => cambiarPv(Math.abs(Number(customDelta) || 1))}
            >
              +
            </Button>
          </div>
          <label className="mt-1 block text-xs">
            <span className="text-muted">Tipo de daño (opcional)</span>
            <select
              className="mt-0.5 w-full rounded border border-white/10 bg-surface px-2 py-1"
              value={tipoDanio}
              onChange={(e) => setTipoDanio(e.target.value)}
            >
              <option value="">—</option>
              {DAMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        {character.combat.hpCurrent === 0 && (
          <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2">
            <p className="mb-1 text-xs font-semibold text-red-300">Salvaciones de muerte</p>
            <div className="mb-2 flex gap-4 text-xs">
              <span>
                Éxitos:{" "}
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={
                      n <= character.combat.deathSaves.successes
                        ? "text-green-400"
                        : "text-muted"
                    }
                  >
                    ●{" "}
                  </span>
                ))}
              </span>
              <span>
                Fallos:{" "}
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={
                      n <= character.combat.deathSaves.failures ? "text-red-400" : "text-muted"
                    }
                  >
                    ●{" "}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button variant="critical" className="px-2 py-1 text-xs" onClick={tirarSalvacionMuerteRoll}>
                Tirar salvación
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() =>
                  onChange({
                    ...character,
                    combat: resetearSalvacionesMuerte(character.combat),
                  })
                }
              >
                Resetear
              </Button>
            </div>
          </div>
        )}

        <div className="mb-2 grid grid-cols-3 gap-2 text-sm">
          <label>
            <span className="text-xs text-muted">PV máx</span>
            <input
              type="number"
              min={1}
              className="mt-0.5 w-full rounded border border-white/10 bg-surface px-2 py-1"
              value={character.combat.hpMax}
              onChange={(e) => {
                const newMax = Math.max(1, Number(e.target.value) || 1);
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    hpMax: newMax,
                    hpCurrent: Math.min(character.combat.hpCurrent, newMax),
                  },
                });
              }}
            />
          </label>
          <label>
            <span className="text-xs text-muted">PV temp</span>
            <input
              type="number"
              min={0}
              className="mt-0.5 w-full rounded border border-white/10 bg-surface px-2 py-1"
              value={character.combat.hpTemp}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    hpTemp: Math.max(0, Number(e.target.value) || 0),
                  },
                })
              }
            />
          </label>
          <label className="flex items-end gap-2 pb-1 text-xs">
            <input
              type="checkbox"
              checked={character.combat.inspiration}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: { ...character.combat, inspiration: e.target.checked },
                })
              }
            />
            Inspiración
          </label>
        </div>

        <p className="mb-2 text-sm">
          CA <strong>{ca}</strong> · Ini {iniciativa(character) >= 0 ? "+" : ""}
          {iniciativa(character)} · {velocidad(character, speciesSpeed ?? 30)} ft
        </p>

        <div className="mb-2 grid gap-2 text-sm sm:grid-cols-2">
          <label>
            <span className="sheet-field-label">Iniciativa fija (opcional)</span>
            <input
              type="number"
              className="sheet-input"
              placeholder={`Auto (DES ${modificadorAtributo(character.abilities.dex) >= 0 ? "+" : ""}${modificadorAtributo(character.abilities.dex)})`}
              title="Si lo rellenas, sustituye al modificador de Destreza en la iniciativa mostrada (p. ej. por dotes o bonificadores fijos)."
              value={character.combat.initiativeOverride ?? ""}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    initiativeOverride: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
            />
            <p className="mt-1 text-xs text-muted">
              Vacío = usa DES. Útil si tu iniciativa no es solo Destreza.
            </p>
          </label>
          <label>
            <span className="sheet-field-label">Velocidad fija (pies)</span>
            <input
              type="number"
              className="sheet-input"
              placeholder={`${velocidad(character, speciesSpeed ?? 30)}`}
              title="Sustituye la velocidad de especie o armadura si necesitas un valor concreto."
              value={character.combat.speedOverride ?? ""}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    speedOverride: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1">
          <Button className="px-2 py-1 text-xs" onClick={() => onChange(aplicarDescansoCorto(character))}>
            Desc. corto
          </Button>
          <Button
            variant="critical"
            className="px-2 py-1 text-xs"
            onClick={() => onChange(aplicarDescansoLargo(character))}
          >
            Desc. largo
          </Button>
          {dadosDeGolpePorClase(character.identity.classes).map(({ die }, _idx, arr) => (
            <Button
              key={die}
              className="px-2 py-1 text-xs"
              aria-label={`Gastar dado de golpe ${die}`}
              onClick={() => {
                const result = gastarDadoGolpe(character, die);
                if (result) {
                  onChange(result.character);
                  setUltimaTirada({
                    mode: "normal",
                    rolls: [result.tirada],
                    used: result.tirada,
                    modifier: 0,
                    total: result.curacion,
                    isCritical: false,
                    isFumble: false,
                    source: "virtual",
                  });
                }
              }}
            >
              {arr.length > 1 ? `Dado ${die}` : "Dado de golpe"}
            </Button>
          ))}
        </div>
        <p className="mt-1 text-sm text-muted">
          Dados disp.: {dadosGolpeDisponibles(character).disponibles}/
          {dadosGolpeDisponibles(character).total}
          {dadosGolpeDisponibles(character).gastados > 0 && (
            <span> ({dadosGolpeDisponibles(character).gastados} gastados)</span>
          )}{" "}
          ·{" "}
          {dadosDeGolpePorClase(character.identity.classes)
            .map(({ die, total }) => `${total}${die}`)
            .join(" + ")}
        </p>
      </section>

      <section className="sheet-card lg:col-span-3">
        <h3 className="sheet-section-title">Salvaciones</h3>
        <div className="space-y-1.5">
          {ABILITY_KEYS.map((key) => {
            const mod = modificadorSalvacion(character, key);
            const proficient = character.proficiencies.savingThrows.includes(key);
            return (
              <div key={key} className="flex items-center justify-between gap-2 text-sm">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={proficient}
                    onChange={() => onChange(toggleSalvacion(character, key))}
                  />
                  <span>
                    {ABILITY_LABELS_ES[key]}
                    {proficient && <span className="text-muted"> · comp.</span>}
                  </span>
                </label>
                <Button
                  variant="critical"
                  className="shrink-0 px-2 py-0.5 text-xs"
                  onClick={() => tirarSalvacionRoll(key)}
                >
                  {mod >= 0 ? `+${mod}` : mod}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sheet-card lg:col-span-4">
        <h3 className="sheet-section-title">Ataques</h3>
        <p className="mb-3 text-sm text-muted">Armas en Equipo · el resultado aparece en el panel de tiradas</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="text-xs text-muted">CA</span>
            <input
              type="number"
              min={0}
              className="mt-0.5 block w-16 rounded border border-white/10 bg-surface px-2 py-1"
              value={caObjetivo}
              onChange={(e) => setCaObjetivo(e.target.value)}
            />
          </label>
          <label className="min-w-0 flex-1 text-sm">
            <span className="text-xs text-muted">Arma</span>
            <select
              className="mt-0.5 block w-full rounded border border-white/10 bg-surface px-2 py-1"
              value={armaSeleccionada}
              onChange={(e) => setArmaSeleccionada(e.target.value)}
            >
              <option value="desarmado">Golpe desarmado</option>
              {armasInventario.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.damage ? ` · ${item.damage}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Button variant="critical" onClick={tirarAtaqueSeleccionado}>
            Atacar
          </Button>
        </div>
        {armasInventario.length === 0 && (
          <p className="mt-2 text-xs text-muted">Sin armas — añádelas en Equipo.</p>
        )}
      </section>

      <div className="grid gap-4 lg:col-span-12 lg:grid-cols-2">
        <ResourcesPanel character={character} onChange={onChange} />
        <DamageTypesEditor character={character} onChange={onChange} />
      </div>

      <div className="lg:col-span-12">
        <ConditionPanel character={character} onChange={onChange} />
      </div>
    </div>
  );
}

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
                  <span className="hidden shrink-0 text-[10px] text-muted sm:inline">{attack.damage}</span>
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
                      actualizarItem(index, { weightLb: Math.max(0, Number(e.target.value) || 0) })
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
                        !item.attuned &&
                        !puedeSintonizar(character.equipment.items, item.id)
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
