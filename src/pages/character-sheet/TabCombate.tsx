import { useEffect, useRef, useState } from "react";
import { ConditionPanel } from "@/components/ConditionPanel";
import { DamageTypesEditor } from "@/components/DamageTypesEditor";
import { ResourcesPanel } from "@/components/ResourcesPanel";
import { Button } from "@/components/layout";
import { ABILITY_KEYS, DAMAGE_TYPES } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import { ABILITY_LABELS_ES, modificadorSalvacion } from "@/rules/character";
import { aplicarCambioPv } from "@/rules/combat-hp";
import {
  registrarFalloSalvacionMuerte,
  resetearSalvacionesMuerte,
  tirarSalvacionMuerte,
} from "@/rules/death-saves";
import { tiradaConcentracionPorDanio } from "@/rules/concentration";
import { tiradaSalvacion } from "@/rules/effects";
import { tirarAtaqueCompleto } from "@/rules/attack-roll";
import { ataquePorId, idAtaqueDefecto } from "@/rules/attacks";
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
} from "@/rules/rests";
import { dadosGolpeDisponibles } from "@/rules/hit-dice";
import { descripcionDadosGolpe } from "@/rules/multiclass";
import { poblarRecursosSugeridos, recursosSugeridos } from "@/rules/resources-tracker";
import { HitDiceSpendButtons } from "@/components/HitDiceSpendButtons";
import { AttackTable } from "@/components/sheet/AttackTable";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useUiStore } from "@/stores/ui-store";

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
  const [armaSeleccionada, setArmaSeleccionada] = useState(() => idAtaqueDefecto(character));

  useEffect(() => {
    setArmaSeleccionada((prev) =>
      ataquePorId(character, prev) ? prev : idAtaqueDefecto(character),
    );
  }, [character]);

  const recursosSyncRef = useRef<string | null>(null);
  useEffect(() => {
    const sugeridos = recursosSugeridos(character);
    const faltaAlguno = sugeridos.some((s) => !character.resources.some((r) => r.id === s.id));
    if (!faltaAlguno) return;
    const key = `${character.id}:${sugeridos.map((s) => s.id).join(",")}`;
    if (recursosSyncRef.current === key) return;
    recursosSyncRef.current = key;
    onChange(poblarRecursosSugeridos(character));
  }, [character, onChange]);

  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const setUltimoAtaque = useUiStore((s) => s.setUltimoAtaque);
  function cantidadPv(): number {
    const n = Number(customDelta);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  function aplicarDanio() {
    const n = cantidadPv();
    if (n > 0) cambiarPv(-n);
  }

  function aplicarCuracion() {
    const n = cantidadPv();
    if (n > 0) cambiarPv(n);
  }

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

  function tirarAtaque(attackId: string) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const attack = ataquePorId(character, attackId);
    if (!attack) return;

    const result = tirarAtaqueCompleto(
      character,
      attack,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      null,
      diceRoll.options,
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimoAtaque(result);
  }

  return (
    <div className="sheet-tab-grid lg:grid-cols-12">
      <section className="sheet-card lg:col-span-4">
        <h3 className="sheet-section-title">Ajustar puntos de golpe</h3>
        <p className="mb-2 text-xs text-muted">
          Total en la barra superior ({character.combat.hpCurrent}/{character.combat.hpMax}
          {character.combat.hpTemp > 0 ? ` +${character.combat.hpTemp} temp` : ""}).
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-white/10">
            <Button
              variant="danger"
              className="rounded-none border-0 px-3 py-1 text-sm"
              aria-label="Restar PV (daño)"
              onClick={aplicarDanio}
            >
              −
            </Button>
            <Button
              variant="default"
              className="rounded-none border-0 border-l border-white/10 px-3 py-1 text-sm"
              aria-label="Sumar PV (curación)"
              onClick={aplicarCuracion}
            >
              +
            </Button>
          </div>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="Cantidad de PV a sumar o restar"
            placeholder="Cantidad"
            className="sheet-input-sm w-24"
            value={customDelta}
            onChange={(e) => setCustomDelta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                aplicarDanio();
              }
            }}
          />
          <select
            className="sheet-input-sm max-w-[9rem] py-1 text-xs"
            aria-label="Tipo de daño (opcional)"
            value={tipoDanio}
            onChange={(e) => setTipoDanio(e.target.value)}
          >
              <option value="">Sin tipo</option>
              {DAMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
              <Button variant="combat" className="px-2 py-1 text-xs" onClick={tirarSalvacionMuerteRoll}>
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
        </div>

        <div className="flex flex-wrap gap-1">
          <Button className="px-2 py-1 text-xs" onClick={() => onChange(aplicarDescansoCorto(character))}>
            Desc. corto
          </Button>
          <Button
            className="px-2 py-1 text-xs"
            onClick={() => onChange(aplicarDescansoLargo(character))}
          >
            Desc. largo
          </Button>
          <HitDiceSpendButtons
            character={character}
            onChange={onChange}
            onRoll={(msg) => setUltimaTirada(null, msg)}
          />
        </div>
        <p className="mt-1 text-sm text-muted">
          Dados disp.: {dadosGolpeDisponibles(character).disponibles}/
          {dadosGolpeDisponibles(character).total}
          {dadosGolpeDisponibles(character).gastados > 0 && (
            <span> ({dadosGolpeDisponibles(character).gastados} gastados)</span>
          )}{" "}
          · {descripcionDadosGolpe(character.identity.classes)}
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
                  variant="combat"
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

      <section className="sheet-card min-w-0 lg:col-span-5">
        <h3 className="sheet-section-title">Ataques</h3>
        <AttackTable
          character={character}
          onChange={onChange}
          selectedId={armaSeleccionada}
          onSelect={setArmaSeleccionada}
          onAttack={tirarAtaque}
        />
      </section>

      <div className="sheet-tab-grid lg:col-span-12 lg:grid-cols-2">
        <ResourcesPanel character={character} onChange={onChange} />
        <ConditionPanel character={character} onChange={onChange} />
      </div>

      <details className="sheet-card lg:col-span-12">
        <summary className="cursor-pointer text-sm font-medium text-muted">
          Resistencias, vulnerabilidades e inmunidades
        </summary>
        <div className="mt-3">
          <DamageTypesEditor character={character} onChange={onChange} />
        </div>
      </details>
    </div>
  );
}
