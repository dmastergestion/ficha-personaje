import { useState } from "react";
import { ClassFeaturesPanel } from "@/components/ClassFeaturesPanel";
import { LevelUpModal } from "@/components/LevelUpModal";
import { BackgroundInfoPanel, SpeciesInfoPanel } from "@/components/OriginInfoPanel";
import { ClassPicker } from "@/components/ClassPicker";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import { Button } from "@/components/layout";
import { SheetCard, SheetLabel } from "@/components/sheet-ui";
import { cn } from "@/lib/utils";
import { ABILITY_KEYS, SKILL_KEYS } from "@/lib/constants";
import type { SkillKey } from "@/lib/constants";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import {
  ABILITY_LABELS_ES,
  modificadorPericia,
  percepcionPasiva,
  SKILL_LABELS_ES,
} from "@/rules/character";
import { tiradaPericia } from "@/rules/effects";
import {
  actualizarNivelClase,
  agregarClase,
  ajustarNivelTotal,
  descripcionClases,
  descripcionDadosGolpe,
  eliminarClase,
  sincronizarIdentidadMulticlase,
  validarClases,
} from "@/rules/multiclass";
import { srdClasses, t as tSrd } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { SHEET_TABS } from "@/pages/character-sheet/types";
import { useCatalogStore } from "@/stores/catalog-store";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useUiStore } from "@/stores/ui-store";
import {
  aplicarBajadaNivel,
  aplicarSubidaNivel,
  detectarBajadaNivel,
  prepararSubidaNivel,
  type LevelUpPreview,
} from "@/rules/level-up";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import type { ClassLevel } from "@/schemas/character";

function NivelStepper({
  value,
  min,
  max,
  onDecrement,
  onIncrement,
  className,
  compact = false,
}: {
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg border border-white/10 bg-surface",
        compact ? "w-fit max-w-[11rem]" : "w-full",
        className,
      )}
    >
      <Button
        variant="critical"
        className="shrink-0 rounded-none px-4 py-2"
        disabled={value <= min}
        onClick={onDecrement}
        aria-label="Bajar nivel"
      >
        −
      </Button>
      <span className="flex flex-1 items-center justify-center text-lg font-semibold tabular-nums">
        {value}
      </span>
      <Button
        className="shrink-0 rounded-none px-4 py-2"
        disabled={value >= max}
        onClick={onIncrement}
        aria-label="Subir nivel"
      >
        +
      </Button>
    </div>
  );
}

export function TabResumen({ character, onChange }: SheetTabProps) {
  const [errorClases, setErrorClases] = useState<string | null>(null);
  const [levelUpPreview, setLevelUpPreview] = useState<LevelUpPreview | null>(null);
  const [pendingClasses, setPendingClasses] = useState<ClassLevel[] | null>(null);
  const catalog = useCatalogStore((s) => s.catalog);
  const pb = bonificadorCompetencia(character.identity.level);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  function togglePericia(skill: SkillKey) {
    const proficient = character.proficiencies.skills.includes(skill);
    const overrides = { ...character.proficiencies.skillOverrides };
    delete overrides[skill];

    const skills = proficient
      ? character.proficiencies.skills.filter((s) => s !== skill)
      : [...character.proficiencies.skills, skill];

    onChange({
      ...character,
      proficiencies: { ...character.proficiencies, skills, skillOverrides: overrides },
    });
  }

  function tirarPericiaRoll(skill: SkillKey) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const mod = modificadorPericia(character, skill);
    const result = tiradaPericia(
      mod,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      diceRoll.options,
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimaTirada(result);
  }

  function aplicarClasesDirecto(classes: ClassLevel[]) {
    const msg = validarClases(classes);
    if (msg) {
      setErrorClases(msg);
      return false;
    }
    setErrorClases(null);
    const sync = sincronizarIdentidadMulticlase(classes);
    onChange(
      poblarRecursosSugeridos({
        ...character,
        identity: { ...character.identity, ...sync },
        combat: { ...character.combat, hitDiceTotal: sync.level },
      }),
    );
    return true;
  }

  function intentarCambioClases(classes: ClassLevel[]) {
    const msg = validarClases(classes);
    if (msg) {
      setErrorClases(msg);
      return;
    }

    const preview = prepararSubidaNivel(character, classes);
    if (preview) {
      setErrorClases(null);
      setPendingClasses(classes);
      setLevelUpPreview(preview);
      return;
    }

    if (detectarBajadaNivel(character.identity.classes, classes)) {
      setErrorClases(null);
      onChange(aplicarBajadaNivel(character, classes));
      return;
    }

    aplicarClasesDirecto(classes);
  }

  function confirmarSubidaNivel(hpGain: number, addToCurrentHp: boolean) {
    if (!pendingClasses) return;
    const msg = validarClases(pendingClasses);
    if (msg) {
      setErrorClases(msg);
      setLevelUpPreview(null);
      setPendingClasses(null);
      return;
    }
    setErrorClases(null);
    onChange(aplicarSubidaNivel(character, pendingClasses, hpGain, addToCurrentHp));
    setLevelUpPreview(null);
    setPendingClasses(null);
  }

  function cancelarSubidaNivel() {
    setLevelUpPreview(null);
    setPendingClasses(null);
  }

  const clasesDisponibles = srdClasses.filter(
    (c) => !character.identity.classes.some((x) => x.classId === c.id),
  );

  return (
    <>
    {levelUpPreview && (
      <LevelUpModal
        preview={levelUpPreview}
        onConfirm={confirmarSubidaNivel}
        onCancel={cancelarSubidaNivel}
      />
    )}
    <div className="space-y-4">
      <SheetCard>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <SheetLabel>Nombre del personaje</SheetLabel>
          <input
            className="sheet-input"
            value={character.identity.name}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, name: e.target.value },
              })
            }
          />
        </label>
        <label className="block">
          <SheetLabel>Jugador</SheetLabel>
          <input
            className="sheet-input"
            value={character.identity.playerName}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, playerName: e.target.value },
              })
            }
          />
        </label>
        <div className="text-sm">
          <SpeciesPicker
            catalog={catalog}
            speciesId={character.identity.speciesId}
            onChange={(speciesId) =>
              onChange({
                ...character,
                identity: { ...character.identity, speciesId },
              })
            }
            className="sheet-select"
          />
        </div>
        {character.identity.classes.length === 1 && (
          <ClassPicker
            catalog={catalog}
            classId={character.identity.classes[0]!.classId}
            onChange={(classId) => {
              if (classId === character.identity.classes[0]!.classId) return;
              aplicarClasesDirecto([
                { classId, subclassId: null, level: character.identity.classes[0]!.level },
              ]);
            }}
          />
        )}
        <label className="block">
          <SheetLabel>Trasfondo</SheetLabel>
          <select
            className="sheet-select"
            value={character.identity.backgroundId ?? ""}
            onChange={(e) =>
              onChange({
                ...character,
                identity: { ...character.identity, backgroundId: e.target.value || null },
              })
            }
          >
            <option value="">—</option>
            {catalog.backgrounds.map((b) => (
              <option key={b.id} value={b.id}>
                {catalog.t("backgrounds", b.id, b.nameEn)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
          <div>
            <SheetLabel>Nivel total</SheetLabel>
            <NivelStepper
            compact
            value={character.identity.level}
            min={character.identity.classes.length}
            max={20}
            onDecrement={() => {
              const next = ajustarNivelTotal(character.identity.classes, -1);
              if (next) intentarCambioClases(next);
            }}
            onIncrement={() => {
              const next = ajustarNivelTotal(character.identity.classes, 1);
              if (next) intentarCambioClases(next);
            }}
          />
          </div>
          <p className="pb-2 text-sm text-muted">
            PB +{pb} · Pasiva {percepcionPasiva(character)}
          </p>
        </div>
      </div>
      </SheetCard>

      <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
      <SheetCard title="Clases (multiclase)">
        <p className="mb-3 text-sm text-muted">{descripcionClases(character.identity.classes)}</p>
        <div className="space-y-2">
          {character.identity.classes.map((cl) => (
            <div
              key={cl.classId}
              className="grid gap-2 rounded-lg bg-panel p-2 sm:grid-cols-[1fr,minmax(9rem,1fr),1fr,auto]"
            >
              <span className="self-center text-sm font-medium">
                {tSrd("classes", cl.classId, cl.classId)}
              </span>
              <NivelStepper
                compact
                value={cl.level}
                min={1}
                max={20}
                onDecrement={() => {
                  const next = actualizarNivelClase(
                    character.identity.classes,
                    cl.classId,
                    cl.level - 1,
                  );
                  intentarCambioClases(next);
                }}
                onIncrement={() => {
                  const next = actualizarNivelClase(
                    character.identity.classes,
                    cl.classId,
                    cl.level + 1,
                  );
                  intentarCambioClases(next);
                }}
              />
              <select
                className="rounded border border-white/10 bg-surface px-2 py-1 text-sm"
                value={cl.subclassId ?? ""}
                onChange={(e) =>
                  aplicarClasesDirecto(
                    character.identity.classes.map((c) =>
                      c.classId === cl.classId
                        ? { ...c, subclassId: e.target.value || null }
                        : c,
                    ),
                  )
                }
              >
                <option value="">Sin subclase</option>
                {catalog.subclasses
                  .filter((sc) => sc.classId === cl.classId)
                  .map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {catalog.t("subclasses", sc.id, sc.nameEn)}
                    </option>
                  ))}
              </select>
              {character.identity.classes.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = eliminarClase(character.identity.classes, cl.classId);
                    if (next) aplicarClasesDirecto(next);
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
                if (next) intentarCambioClases(next);
                e.target.value = "";
              }}
            >
              <option value="">Añadir clase…</option>
              {clasesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {catalog.t("classes", c.id, c.nameEn)}
                </option>
              ))}
            </select>
          </div>
        )}
        {errorClases && <p className="mt-2 text-sm text-red-300">{errorClases}</p>}
      </SheetCard>

      <p className="text-sm text-muted">
        Dados de golpe: {descripcionDadosGolpe(character.identity.classes)}
      </p>

      {character.identity.speciesId && catalog.obtenerEspecie(character.identity.speciesId) && (
        <SpeciesInfoPanel
          species={catalog.obtenerEspecie(character.identity.speciesId)!}
          name={catalog.t("species", character.identity.speciesId, character.identity.speciesId)}
        />
      )}
      {character.identity.backgroundId &&
        catalog.obtenerTrasfondo(character.identity.backgroundId) && (
          <BackgroundInfoPanel
            background={catalog.obtenerTrasfondo(character.identity.backgroundId)!}
            name={catalog.t(
              "backgrounds",
              character.identity.backgroundId,
              character.identity.backgroundId,
            )}
          />
        )}

      <ClassFeaturesPanel classes={character.identity.classes} />
      </div>

      <div className="space-y-4">
      <SheetCard title="Atributos">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
        {ABILITY_KEYS.map((key) => {
          const mod = modificadorAtributo(character.abilities[key]);
          return (
            <div key={key} className="rounded-lg border border-white/10 bg-surface px-3 py-3">
              <span className="text-sm font-medium text-muted">{ABILITY_LABELS_ES[key]}</span>
              <input
                type="number"
                min={1}
                max={30}
                className="mt-1 w-full bg-transparent text-2xl font-bold tabular-nums outline-none"
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
                className="mt-2 w-full text-sm"
                onClick={() => {
                  if (!diceRoll.isReady) {
                    setUltimaTirada(null, diceRoll.error);
                    return;
                  }
                  const result = tiradaPericia(
                    mod,
                    rollMode,
                    character.combat.conditionIds,
                    character.combat.exhaustionLevel,
                    diceRoll.options,
                  );
                  if ("error" in result) {
                    setUltimaTirada(null, result.error);
                    return;
                  }
                  setUltimaTirada(result);
                }}
              >
                {mod >= 0 ? `+${mod}` : mod} d20
              </Button>
            </div>
          );
        })}
      </div>
      </SheetCard>

      <SheetCard title="Pericias">
        <div className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2 lg:max-h-[32rem]">
          {SKILL_KEYS.map((skill) => {
            const mod = modificadorPericia(character, skill);
            const proficient =
              skill in character.proficiencies.skillOverrides
                ? (character.proficiencies.skillOverrides[skill] ?? false)
                : character.proficiencies.skills.includes(skill);
            return (
              <div
                key={skill}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={proficient}
                    onChange={() => togglePericia(skill)}
                  />
                  <span className={proficient ? "font-medium" : "text-muted"}>
                    {SKILL_LABELS_ES[skill]}
                  </span>
                </label>
                <Button
                  variant="critical"
                  className="shrink-0 px-3 py-1 text-sm"
                  onClick={() => tirarPericiaRoll(skill)}
                >
                  {mod >= 0 ? `+${mod}` : mod}
                </Button>
              </div>
            );
          })}
        </div>
      </SheetCard>

      </div>
      </div>
    </div>
    </>
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
    <div className="sheet-tab-bar" role="tablist" aria-label="Secciones de la ficha">
      {SHEET_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn("sheet-tab", active === tab.id && "sheet-tab-active")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
