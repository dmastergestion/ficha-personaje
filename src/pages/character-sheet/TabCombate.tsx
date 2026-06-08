import { Button } from "@/components/layout";
import { ABILITY_KEYS, SKILL_KEYS } from "@/lib/constants";
import {
  ABILITY_LABELS_ES,
  SKILL_LABELS_ES,
  iniciativa,
  modificadorPericia,
  modificadorSalvacion,
  velocidad,
} from "@/rules/character";
import { calcularClaseArmadura } from "@/rules/combat";
import { tirarD20 } from "@/rules/dice";
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
  gastarDadoGolpe,
} from "@/rules/rests";
import { srdArmor, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useUiStore } from "@/stores/ui-store";

const ARMOR_OPTIONS = srdArmor.filter((item) => item.category !== "shield");

export function TabCombate({ character, onChange }: SheetTabProps) {
  const setUltimaTirada = useUiStore((state) => state.setUltimaTirada);
  const ultimaTirada = useUiStore((state) => state.ultimaTirada);
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
        </div>
        <p className="mb-3 text-sm">
          CA {ca} · Iniciativa {iniciativa(character) >= 0 ? "+" : ""}
          {iniciativa(character)} · Velocidad {velocidad(character)} ft · Temp{" "}
          {character.combat.hpTemp}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onChange(aplicarDescansoCorto(character))}>
            Descanso corto
          </Button>
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
            return (
              <div key={key} className="flex items-center justify-between py-1 text-sm">
                <span>{ABILITY_LABELS_ES[key]}</span>
                <Button
                  variant="critical"
                  onClick={() => setUltimaTirada(tirarD20(mod, "normal"))}
                >
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
              return (
                <div key={skill} className="flex items-center justify-between text-sm">
                  <span>{SKILL_LABELS_ES[skill]}</span>
                  <Button
                    variant="critical"
                    onClick={() => setUltimaTirada(tirarD20(mod, "normal"))}
                  >
                    d20
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-2 font-semibold">Condiciones</h3>
        <textarea
          className="min-h-20 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
          placeholder="Una condición por línea (manual v1)"
          value={character.combat.conditions.join("\n")}
          onChange={(e) =>
            onChange({
              ...character,
              combat: {
                ...character.combat,
                conditions: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </section>

      {ultimaTirada && (
        <p className="rounded-lg bg-panel px-3 py-2 text-sm">
          Última tirada: {ultimaTirada.used} + {ultimaTirada.modifier} ={" "}
          <strong>{ultimaTirada.total}</strong>
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
        <h3 className="mb-2 font-semibold">Inventario libre</h3>
        <textarea
          className="min-h-32 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
          placeholder="Objetos, uno por línea"
          value={character.equipment.items.map((i) => i.name).join("\n")}
          onChange={(e) =>
            onChange({
              ...character,
              equipment: {
                ...character.equipment,
                items: e.target.value
                  .split("\n")
                  .map((name, idx) => ({
                    id: String(idx),
                    name: name.trim(),
                    qty: 1,
                  }))
                  .filter((i) => i.name),
              },
            })
          }
        />
      </div>
    </div>
  );
}
