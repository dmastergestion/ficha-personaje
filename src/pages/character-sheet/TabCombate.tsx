import { useEffect, useState } from "react";
import { ConditionPanel } from "@/components/ConditionPanel";
import { DamageTypesEditor } from "@/components/DamageTypesEditor";
import { HpTypeSelect } from "@/components/HpTypeSelect";
import { ResourcesPanel } from "@/components/ResourcesPanel";
import { InfoTrigger } from "@/components/InfoTrigger";
import { ResourceInfoPanel } from "@/components/ResourceInfoPanel";
import { Button } from "@/components/layout";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import {
  ABILITY_LABELS_ES,
  modificadorSalvacion,
} from "@/rules/character";
import {
  aplicarCambioPvConConcentracion,
  AVISO_DANIO_SIN_TIPO_RABIA,
} from "@/rules/combat-hp";
import {
  resetearSalvacionesMuerte,
  tirarSalvacionMuerte,
} from "@/rules/death-saves";
import { tiradaSalvacion } from "@/rules/effects";
import { tirarAtaqueCompleto } from "@/rules/attack-roll";
import { ataquePorId, idAtaqueDefecto } from "@/rules/attacks";
import {
  aplicarDescansoCorto,
  aplicarDescansoLargo,
} from "@/rules/rests";
import { dadosGolpeDisponibles } from "@/rules/hit-dice";
import { descripcionDadosGolpe } from "@/rules/multiclass";
import { HitDiceSpendButtons } from "@/components/HitDiceSpendButtons";
import { AttackTable } from "@/components/sheet/AttackTable";
import { WildShapePanel } from "@/components/WildShapePanel";
import { UsosContador } from "@/components/UsosContador";
import { fijarRabia, RAGE_RESOURCE_ID } from "@/rules/resource-use";
import {
  esCorazonSalvaje,
  opcionRabiaCorazonSalvaje,
  textoOpcionRabia,
  WILD_HEART_RAGE_KEY,
  WILD_HEART_RAGE_OPTIONS,
  type WildHeartRageOption,
} from "@/rules/wild-heart";
import { rasgosDeClase } from "@/rules/class-features";
import { desventajaPruebaCaracteristica } from "@/rules/proficiencies";
import { resumenRecurso } from "@/rules/resource-text";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { pedirDadoFisico, useDiceRollOptions } from "@/hooks/useDiceRollOptions";
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
  const [armaSeleccionada, setArmaSeleccionada] = useState(() => idAtaqueDefecto(character));

  useEffect(() => {
    setArmaSeleccionada((prev) =>
      ataquePorId(character, prev) ? prev : idAtaqueDefecto(character),
    );
  }, [character]);

  const rollMode = useUiStore((s) => s.rollMode);
  const tipoDanio = useUiStore((s) => s.tipoDanio);
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
      pedirDadoFisico(diceRoll.error);
      return;
    }

    const aplicado = aplicarCambioPvConConcentracion(
      character,
      delta,
      rollMode,
      diceRoll.options,
      { damageType: tipoDanio || undefined },
    );
    if (aplicado.warning) {
      setUltimaTirada(null, aplicado.warning);
      return;
    }
    if (aplicado.deathMessage) {
      setUltimaTirada(null, aplicado.deathMessage);
    }
    if (aplicado.concentration) {
      const conc = aplicado.concentration;
      setUltimaTirada(
        conc.roll,
        conc.maintained
          ? `Concentración · CD ${conc.dc} · mantienes el conjuro`
          : `Concentración · CD ${conc.dc} · pierdes el conjuro`,
      );
    }
    onChange(aplicado.character);
  }

  function tirarSalvacionMuerteRoll() {
    if (!diceRoll.isReady) {
      pedirDadoFisico(diceRoll.error);
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
      pedirDadoFisico(diceRoll.error);
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
      { desventaja: desventajaPruebaCaracteristica(character, key), ventaja: character.combat.raging && key === "str" },
    );
    if ("autoFallo" in result) {
      if (result.razon.includes("dado")) {
        pedirDadoFisico(result.razon);
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
      pedirDadoFisico(diceRoll.error);
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

  const esBarbaro = character.identity.classes.some((c) => c.classId === "barbarian");
  const rasgosBarbaro = esBarbaro ? rasgosDeClase("barbarian") : [];
  const descRabia = rasgosBarbaro.find((f) => f.name === "Rabia")?.description ?? "";
  const descTemerario =
    rasgosBarbaro.find((f) => f.name === "Ataque temerario")?.description ?? "";
  const recursoRabia = character.resources.find((r) => r.id === RAGE_RESOURCE_ID);

  return (
    <div className="sheet-tab-grid lg:grid-cols-12">
      <div className="sheet-tab-stack lg:col-span-7">
        <section className="sheet-card">
          <h3 className="sheet-section-title">Daño y curación</h3>
          <div className="mb-2 flex flex-wrap items-center gap-2">
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
            <HpTypeSelect required={character.combat.raging} />
            <Button
              variant="danger"
              className="min-h-10 px-3"
              aria-label="Restar PV (daño)"
              onClick={aplicarDanio}
            >
              Daño
            </Button>
            <Button
              variant="success"
              className="min-h-10 px-3"
              aria-label="Sumar PV (curación)"
              onClick={aplicarCuracion}
            >
              Curar
            </Button>
          </div>
          {character.combat.raging && !tipoDanio && (
            <p className="mb-2 text-xs text-amber-200">{AVISO_DANIO_SIN_TIPO_RABIA}</p>
          )}

          {character.combat.hpCurrent === 0 && (
            <div className="mb-2 rounded-lg border border-danger/30 bg-danger/10 p-2">
              <p className="mb-1 text-xs font-semibold text-danger">Salvaciones de muerte</p>
              <div className="mb-2 flex gap-4 text-xs">
                <span>
                  Éxitos:{" "}
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={
                        n <= character.combat.deathSaves.successes
                          ? "text-success"
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
                        n <= character.combat.deathSaves.failures ? "text-danger" : "text-muted"
                      }
                    >
                      ●{" "}
                    </span>
                  ))}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button variant="primary" className="min-h-10 px-3 text-sm" onClick={tirarSalvacionMuerteRoll}>
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

          <div className="mb-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
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

        <ResourcesPanel character={character} onChange={onChange} />

        <section className="sheet-card min-w-0">
          <h3 className="sheet-section-title">Ataques</h3>
          <AttackTable
            character={character}
            onChange={onChange}
            selectedId={armaSeleccionada}
            onSelect={setArmaSeleccionada}
            onAttack={tirarAtaque}
          />
        </section>
      </div>

      <div className="sheet-tab-stack lg:col-span-5">
        {esBarbaro && (
          <section className="sheet-card">
            <h3 className="sheet-section-title">Rabia</h3>
            {esCorazonSalvaje(character) && (
              <label className="mb-2 block text-sm">
                <span className="text-muted">Opción de Rabia</span>
                <select
                  className="sheet-input-sm mt-0.5 w-full py-1 text-xs"
                  aria-label="Opción de Rabia de las tierras salvajes"
                  value={opcionRabiaCorazonSalvaje(character) ?? "bear"}
                  onChange={(e) => {
                    const wildHeart = e.target.value as WildHeartRageOption;
                    onChange({
                      ...character,
                      originChoices: {
                        ...character.originChoices,
                        class: {
                          ...character.originChoices.class,
                          [WILD_HEART_RAGE_KEY]: wildHeart,
                        },
                      },
                    });
                  }}
                >
                  {WILD_HEART_RAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="mt-0.5 block text-xs text-muted">
                  {textoOpcionRabia(opcionRabiaCorazonSalvaje(character))}
                </span>
              </label>
            )}
            <div className="flex items-center gap-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={character.combat.raging}
                  onChange={(e) => {
                    const next = fijarRabia(character, e.target.checked, {
                      wildHeart: opcionRabiaCorazonSalvaje(character) ?? undefined,
                    });
                    if (!next.ok) {
                      window.alert(next.error);
                      return;
                    }
                    onChange(next.character);
                  }}
                />
                Rabia activa
              </label>
              {descRabia ? (
                <InfoTrigger
                  tip={resumenRecurso(descRabia)}
                  title="Rabia"
                  panel={<ResourceInfoPanel texto={descRabia} />}
                  className="h-5 w-5 shrink-0 text-[10px]"
                />
              ) : null}
              {recursoRabia ? (
                <UsosContador
                  restantes={Math.max(0, recursoRabia.max - recursoRabia.used)}
                  max={recursoRabia.max}
                  compact
                />
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={character.combat.reckless}
                  onChange={(e) =>
                    onChange({
                      ...character,
                      combat: { ...character.combat, reckless: e.target.checked },
                    })
                  }
                />
                Ataque temerario
              </label>
              {descTemerario ? (
                <InfoTrigger
                  tip={resumenRecurso(descTemerario)}
                  title="Ataque temerario"
                  panel={<ResourceInfoPanel texto={descTemerario} />}
                  className="h-5 w-5 shrink-0 text-[10px]"
                />
              ) : null}
            </div>
          </section>
        )}

        <WildShapePanel character={character} onChange={onChange} />

        <ConditionPanel character={character} onChange={onChange} />

        <section className="sheet-card">
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
                    variant="primary"
                    className="min-h-10 min-w-10 shrink-0 px-2 py-1 text-sm"
                    onClick={() => tirarSalvacionRoll(key)}
                  >
                    {mod >= 0 ? `+${mod}` : mod}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <details className="sheet-card">
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Resistencias, vulnerabilidades e inmunidades
          </summary>
          <div className="mt-3">
            <DamageTypesEditor character={character} onChange={onChange} />
          </div>
        </details>
      </div>
    </div>
  );
}
