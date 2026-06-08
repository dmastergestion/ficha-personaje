import { useState } from "react";
import { ConditionPanel } from "@/components/ConditionPanel";
import { Button } from "@/components/layout";
import { RollModeSelector } from "@/components/RollModeSelector";
import { ABILITY_KEYS, SKILL_KEYS } from "@/lib/constants";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import {
  ABILITY_LABELS_ES,
  SKILL_LABELS_ES,
  iniciativa,
  modificadorPericia,
  modificadorSalvacion,
  velocidad,
} from "@/rules/character";
import { calcularClaseArmadura } from "@/rules/combat";
import { tiradaPericia, tiradaSalvacion } from "@/rules/effects";
import {
  capacidadCarga,
  estadoCarga,
  etiquetaEstadoCarga,
  pesoTotalInventario,
} from "@/rules/inventory";
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
  gastarDadoGolpe,
} from "@/rules/rests";
import { srdArmor, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import type { EquipmentItem } from "@/schemas/character";
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

function togglePericia(character: SheetTabProps["character"], skill: SkillKey) {
  const proficient = character.proficiencies.skills.includes(skill);
  const overrides = { ...character.proficiencies.skillOverrides };
  delete overrides[skill];

  const skills = proficient
    ? character.proficiencies.skills.filter((s) => s !== skill)
    : [...character.proficiencies.skills, skill];

  return {
    ...character,
    proficiencies: { ...character.proficiencies, skills, skillOverrides: overrides },
  };
}

export function TabCombate({ character, onChange }: SheetTabProps) {
  const [customDelta, setCustomDelta] = useState("5");
  const rollMode = useUiStore((s) => s.rollMode);
  const setRollMode = useUiStore((s) => s.setRollMode);
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const ultimaTirada = useUiStore((s) => s.ultimaTirada);
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );

  function ajustarPv(delta: number) {
    const hpCurrent = Math.min(
      character.combat.hpMax + character.combat.hpTemp,
      Math.max(0, character.combat.hpCurrent + delta),
    );
    onChange({ ...character, combat: { ...character.combat, hpCurrent } });
  }

  function tirarSalvacionRoll(key: AbilityKey) {
    const mod = modificadorSalvacion(character, key);
    const result = tiradaSalvacion(
      mod,
      key,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
    );
    if ("autoFallo" in result) {
      setUltimaTirada({
        mode: "normal",
        rolls: [1],
        used: 1,
        modifier: mod,
        total: 1 + mod,
        isCritical: false,
        isFumble: true,
      });
      return;
    }
    setUltimaTirada(result);
  }

  function tirarPericiaRoll(skill: SkillKey) {
    const mod = modificadorPericia(character, skill);
    setUltimaTirada(
      tiradaPericia(mod, rollMode, character.combat.conditionIds, character.combat.exhaustionLevel),
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold">
            PV {character.combat.hpCurrent}/{character.combat.hpMax}
          </span>
          <Button variant="critical" onClick={() => ajustarPv(-1)}>
            −1
          </Button>
          <Button variant="critical" onClick={() => ajustarPv(-5)}>
            −5
          </Button>
          <Button variant="critical" onClick={() => ajustarPv(1)}>
            +1
          </Button>
          <Button variant="critical" onClick={() => ajustarPv(5)}>
            +5
          </Button>
          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-14 rounded-lg border border-white/10 bg-surface px-2 py-1 text-sm"
              value={customDelta}
              onChange={(e) => setCustomDelta(e.target.value)}
            />
            <Button variant="critical" onClick={() => ajustarPv(Number(customDelta) || 0)}>
              ±
            </Button>
          </div>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-muted">PV máx</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1"
              value={character.combat.hpMax}
              onChange={(e) =>
                onChange({
                  ...character,
                  combat: {
                    ...character.combat,
                    hpMax: Math.max(1, Number(e.target.value) || 1),
                    hpCurrent: Math.min(
                      character.combat.hpCurrent,
                      Math.max(1, Number(e.target.value) || 1) + character.combat.hpTemp,
                    ),
                  },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">PV temp</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1"
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
          <label className="flex items-center gap-2 pt-5 text-sm">
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
            Inspiración heroica
          </label>
        </div>

        <p className="mb-3 text-sm">
          CA {ca} · Iniciativa {iniciativa(character) >= 0 ? "+" : ""}
          {iniciativa(character)} · Velocidad {velocidad(character)} ft
        </p>

        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">Override iniciativa</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1"
              placeholder="Automática"
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
          </label>
          <label className="block text-sm">
            <span className="text-muted">Override velocidad (ft)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1"
              placeholder="30"
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

        <RollModeSelector mode={rollMode} onChange={setRollMode} />

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => onChange(aplicarDescansoCorto(character))}>Descanso corto</Button>
          <Button variant="critical" onClick={() => onChange(aplicarDescansoLargo(character))}>
            Descanso largo
          </Button>
          <Button
            onClick={() => {
              const result = gastarDadoGolpe(character);
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
                });
              }
            }}
          >
            Gastar dado de golpe
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Dados de golpe: {character.combat.hitDiceUsed}/{character.combat.hitDiceTotal}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h3 className="mb-2 font-semibold">Salvaciones</h3>
          {ABILITY_KEYS.map((key) => {
            const mod = modificadorSalvacion(character, key);
            const proficient = character.proficiencies.savingThrows.includes(key);
            return (
              <div key={key} className="flex items-center justify-between gap-2 py-1 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={proficient}
                    onChange={() => onChange(toggleSalvacion(character, key))}
                  />
                  {ABILITY_LABELS_ES[key]}
                </label>
                <Button variant="critical" onClick={() => tirarSalvacionRoll(key)}>
                  {mod >= 0 ? `+${mod}` : mod} d20
                </Button>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-white/10 bg-panel p-4">
          <h3 className="mb-2 font-semibold">Pericias</h3>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {SKILL_KEYS.map((skill) => {
              const mod = modificadorPericia(character, skill);
              const proficient =
                skill in character.proficiencies.skillOverrides
                  ? (character.proficiencies.skillOverrides[skill] ?? false)
                  : character.proficiencies.skills.includes(skill);
              return (
                <div key={skill} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={proficient}
                      onChange={() => onChange(togglePericia(character, skill))}
                    />
                    {SKILL_LABELS_ES[skill]}
                  </label>
                  <Button variant="critical" onClick={() => tirarPericiaRoll(skill)}>
                    {mod >= 0 ? `+${mod}` : mod}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ConditionPanel character={character} onChange={onChange} />

      {ultimaTirada && (
        <p className="rounded-lg bg-panel px-3 py-2 text-sm">
          Última tirada ({ultimaTirada.mode}): {ultimaTirada.used} + {ultimaTirada.modifier} ={" "}
          <strong>{ultimaTirada.total}</strong>
          {ultimaTirada.isCritical && " · ¡Crítico!"}
          {ultimaTirada.isFumble && " · ¡Pifia!"}
        </p>
      )}
    </div>
  );
}

export function TabEquipo({ character, onChange }: SheetTabProps) {
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
  const pesoTotal = pesoTotalInventario(character.equipment.items);
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

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-panel p-4">
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
      <p className="text-sm">CA calculada: {ca}</p>
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

        <div className="space-y-2">
          {character.equipment.items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg bg-surface p-2 sm:grid-cols-[1fr,4rem,5rem,1fr,auto]"
            >
              <input
                className="rounded border border-white/10 bg-panel px-2 py-1 text-sm"
                placeholder="Nombre"
                value={item.name}
                onChange={(e) => actualizarItem(index, { name: e.target.value })}
              />
              <input
                type="number"
                min={0}
                className="rounded border border-white/10 bg-panel px-2 py-1 text-sm"
                title="Cantidad"
                value={item.qty}
                onChange={(e) =>
                  actualizarItem(index, { qty: Math.max(0, Number(e.target.value) || 0) })
                }
              />
              <input
                type="number"
                min={0}
                step={0.1}
                className="rounded border border-white/10 bg-panel px-2 py-1 text-sm"
                title="Peso (lb) por unidad"
                value={item.weightLb}
                onChange={(e) =>
                  actualizarItem(index, { weightLb: Math.max(0, Number(e.target.value) || 0) })
                }
              />
              <input
                className="rounded border border-white/10 bg-panel px-2 py-1 text-sm"
                placeholder="Notas"
                value={item.notes ?? ""}
                onChange={(e) => actualizarItem(index, { notes: e.target.value || undefined })}
              />
              <Button variant="ghost" onClick={() => eliminarItem(index)}>
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Button className="mt-3" onClick={agregarItem}>
          Añadir objeto
        </Button>
      </div>
    </div>
  );
}
