import { useState } from "react";
import { Button } from "@/components/layout";
import { cn } from "@/lib/utils";
import { ABILITY_KEYS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { ABILITY_LABELS_ES } from "@/rules/character";
import { tiradaPericia } from "@/rules/effects";
import {
  actualizarNivelClase,
  agregarClase,
  descripcionClases,
  eliminarClase,
  sincronizarIdentidadMulticlase,
  validarClases,
} from "@/rules/multiclass";
import { srdBackgrounds, srdClasses, srdSpecies, srdSubclasses, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { SHEET_TABS } from "@/pages/character-sheet/types";
import { useUiStore } from "@/stores/ui-store";

export function TabResumen({ character, onChange }: SheetTabProps) {
  const [errorClases, setErrorClases] = useState<string | null>(null);
  const pb = bonificadorCompetencia(character.identity.level);
  const rollMode = useUiStore((s) => s.rollMode);
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  function aplicarClases(classes: typeof character.identity.classes) {
    const msg = validarClases(classes);
    if (msg) {
      setErrorClases(msg);
      return;
    }
    setErrorClases(null);
    const sync = sincronizarIdentidadMulticlase(classes);
    onChange({
      ...character,
      identity: { ...character.identity, ...sync },
      combat: { ...character.combat, hitDiceTotal: sync.level },
    });
  }

  const clasesDisponibles = srdClasses.filter(
    (c) => !character.identity.classes.some((x) => x.classId === c.id),
  );

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-panel p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-muted">Nombre</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.name}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, name: e.target.value },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Jugador</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.playerName}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, playerName: e.target.value },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Nivel total</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.level}
            readOnly
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Especie</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.speciesId ?? ""}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, speciesId: e.target.value || null },
              })
            }
          >
            {srdSpecies.map((s) => (
              <option key={s.id} value={s.id}>
                {t("species", s.id, s.nameEn)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Trasfondo</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.backgroundId ?? ""}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, backgroundId: e.target.value || null },
              })
            }
          >
            <option value="">—</option>
            {srdBackgrounds.map((b) => (
              <option key={b.id} value={b.id}>
                {t("backgrounds", b.id, b.nameEn)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="rounded-lg bg-surface p-3">
        <h3 className="mb-2 font-semibold">Clases (multiclase)</h3>
        <p className="mb-3 text-sm text-muted">{descripcionClases(character.identity.classes)}</p>
        <div className="space-y-2">
          {character.identity.classes.map((cl) => (
            <div
              key={cl.classId}
              className="grid gap-2 rounded-lg bg-panel p-2 sm:grid-cols-[1fr,5rem,1fr,auto]"
            >
              <span className="self-center text-sm font-medium">
                {t("classes", cl.classId, cl.classId)}
              </span>
              <input
                type="number"
                min={1}
                max={20}
                className="rounded border border-white/10 bg-surface px-2 py-1 text-sm"
                value={cl.level}
                onChange={(e) =>
                  aplicarClases(
                    actualizarNivelClase(
                      character.identity.classes,
                      cl.classId,
                      Number(e.target.value) || 1,
                    ),
                  )
                }
              />
              <select
                className="rounded border border-white/10 bg-surface px-2 py-1 text-sm"
                value={cl.subclassId ?? ""}
                onChange={(e) =>
                  aplicarClases(
                    character.identity.classes.map((c) =>
                      c.classId === cl.classId
                        ? { ...c, subclassId: e.target.value || null }
                        : c,
                    ),
                  )
                }
              >
                <option value="">Sin subclase</option>
                {srdSubclasses
                  .filter((sc) => sc.classId === cl.classId)
                  .map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {t("subclasses", sc.id, sc.nameEn)}
                    </option>
                  ))}
              </select>
              {character.identity.classes.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = eliminarClase(character.identity.classes, cl.classId);
                    if (next) aplicarClases(next);
                  }}
                >
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {clasesDisponibles.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              id="add-class"
              className="rounded border border-white/10 bg-surface px-2 py-1 text-sm"
              defaultValue=""
              onChange={(e) => {
                const classId = e.target.value;
                if (!classId) return;
                const next = agregarClase(character.identity.classes, classId);
                if (next) aplicarClases(next);
                e.target.value = "";
              }}
            >
              <option value="">Añadir clase…</option>
              {clasesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {t("classes", c.id, c.nameEn)}
                </option>
              ))}
            </select>
          </div>
        )}
        {errorClases && <p className="mt-2 text-sm text-red-400">{errorClases}</p>}
      </section>

      <p className="text-sm text-muted">
        PB +{pb} · Dado de golpe {character.combat.hitDie}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ABILITY_KEYS.map((key) => {
          const mod = modificadorAtributo(character.abilities[key]);
          return (
            <div key={key} className="rounded-lg bg-surface px-3 py-2 text-sm">
              <span className="text-muted">{ABILITY_LABELS_ES[key]}</span>
              <input
                type="number"
                min={1}
                max={30}
                className="mt-1 w-full bg-transparent text-lg font-semibold outline-none"
                value={character.abilities[key]}
                onChange={(e) =>
                  onChange({
                    ...character,
                    abilities: {
                      ...character.abilities,
                      [key]: Math.min(30, Math.max(1, Number(e.target.value) || 10)),
                    },
                  })
                }
              />
              <Button
                variant="critical"
                className="mt-1 w-full text-xs"
                onClick={() =>
                  setUltimaTirada(
                    tiradaPericia(
                      mod,
                      rollMode,
                      character.combat.conditionIds,
                      character.combat.exhaustionLevel,
                    ),
                  )
                }
              >
                {mod >= 0 ? `+${mod}` : mod} d20
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SheetTabBar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (tab: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-2">
      {SHEET_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={cn(
            "rounded-lg px-3 py-2 text-sm transition",
            active === tab.id ? "bg-gold font-semibold text-black" : "text-muted hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
