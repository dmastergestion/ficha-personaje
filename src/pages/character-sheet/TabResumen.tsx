import { Button } from "@/components/layout";
import { cn } from "@/lib/utils";
import { ABILITY_KEYS } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { ABILITY_LABELS_ES } from "@/rules/character";
import { tirarD20 } from "@/rules/dice";
import { srdBackgrounds, srdSpecies, srdSubclasses, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { SHEET_TABS } from "@/pages/character-sheet/types";
import { useUiStore } from "@/stores/ui-store";

export function TabResumen({ character, onChange }: SheetTabProps) {
  const pb = bonificadorCompetencia(character.identity.level);
  const rollMode = useUiStore((s) => s.rollMode);
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

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
          <span className="text-muted">Nivel</span>
          <input
            type="number"
            min={1}
            max={20}
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.level}
            onChange={(e) => {
              const level = Math.min(20, Math.max(1, Number(e.target.value) || 1));
              onChange({
                ...character,
                identity: { ...character.identity, level },
                combat: { ...character.combat, hitDiceTotal: level },
              });
            }}
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
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="text-muted">Subclase</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={character.identity.subclassId ?? ""}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, subclassId: e.target.value || null },
              })
            }
          >
            <option value="">—</option>
            {srdSubclasses
              .filter((sc) => sc.classId === character.identity.classId)
              .map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {t("subclasses", sc.id, sc.nameEn)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-muted">
        {t("classes", character.identity.classId, character.identity.classId)} · PB +{pb} · Dado
        de golpe {character.combat.hitDie}
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
                onClick={() => setUltimaTirada(tirarD20(mod, rollMode))}
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
