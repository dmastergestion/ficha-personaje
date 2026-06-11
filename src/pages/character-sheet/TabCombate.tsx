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
import { aplicarCambioPv } from "@/rules/combat-hp";
import {
  registrarFalloSalvacionMuerte,
  resetearSalvacionesMuerte,
  tirarSalvacionMuerte,
} from "@/rules/death-saves";
import { tiradaConcentracionPorDanio } from "@/rules/concentration";
import { tiradaSalvacion } from "@/rules/effects";
import { tirarAtaqueCompleto } from "@/rules/attack-roll";
import { ataqueDesdeItem, esItemAtacable, GOLPE_DESARMADO } from "@/rules/attacks";
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
  gastarDadoGolpe,
} from "@/rules/rests";
import { dadosGolpeDisponibles } from "@/rules/hit-dice";
import { dadosDeGolpePorClase } from "@/rules/multiclass";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useCatalogStore } from "@/stores/catalog-store";
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
  const [armaSeleccionada, setArmaSeleccionada] = useState("desarmado");
  const catalog = useCatalogStore((s) => s.catalog);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const speciesSpeed = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.speed
    : undefined;
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const setUltimoAtaque = useUiStore((s) => s.setUltimoAtaque);
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
          Ini {iniciativa(character) >= 0 ? "+" : ""}
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

      <div className="lg:col-span-12">
        <ResourcesPanel character={character} onChange={onChange} />
      </div>

      <div className="lg:col-span-12">
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
