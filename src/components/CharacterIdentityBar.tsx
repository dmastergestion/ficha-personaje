import { ClassPicker } from "@/components/ClassPicker";
import { SpeciesPicker } from "@/components/SpeciesPicker";
import { SubclassPicker } from "@/components/SubclassPicker";
import { Button } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  descripcionClases,
  errorRequisitoAtributos,
  faltaElegirSubclase,
  nivelTotalClases,
  textoRequisitoMulticlase,
  validarRequisitosMulticlase,
} from "@/rules/multiclass";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";

function NivelStepper({
  value,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex w-fit max-w-[9rem] items-stretch overflow-hidden rounded-lg border border-white/10 bg-surface">
      <Button
        className="shrink-0 rounded-none border-0 px-2.5 py-1"
        disabled={value <= min}
        onClick={onDecrement}
        aria-label="Bajar nivel"
      >
        −
      </Button>
      <span className="flex min-w-[1.75rem] flex-1 items-center justify-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <Button
        className="shrink-0 rounded-none px-2.5 py-1"
        disabled={value >= max}
        onClick={onIncrement}
        aria-label="Subir nivel"
      >
        +
      </Button>
    </div>
  );
}

export function CharacterIdentityBar({
  character,
  catalog,
  onChange,
  onClassChange,
  onAddClass,
  onOriginChange,
  onLevelChange,
  className,
}: {
  character: Character;
  catalog: GameCatalog;
  onChange: (next: Character) => void;
  onClassChange: (classId: string) => void;
  onAddClass: (classId: string) => void;
  onOriginChange: (speciesId: string | null, backgroundId: string | null) => void;
  onLevelChange: (delta: -1 | 1) => void;
  className?: string;
}) {
  const idsActuales = new Set(character.identity.classes.map((c) => c.classId));
  const puedeAnadir =
    nivelTotalClases(character.identity.classes) < 20 &&
    catalog.classes.some((c) => !idsActuales.has(c.id));
  const bloqueoClaseActual = errorRequisitoAtributos(
    character.identity.classes,
    character.abilities,
  );

  return (
    <div className={cn("sheet-pdf-identity border-0 pb-0", className)}>
      {character.identity.classes.length === 1 ? (
        <ClassPicker
          compact
          catalog={catalog}
          classId={character.identity.classes[0]!.classId}
          className="sheet-select-compact min-w-[6rem]"
          onChange={onClassChange}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0 text-muted">Clase</span>
          <span className="truncate">{descripcionClases(character.identity.classes)}</span>
        </div>
      )}
      {puedeAnadir && (
        <label className="flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0 text-muted whitespace-nowrap">Añadir clase</span>
          <select
            className="sheet-select-compact min-w-[6rem]"
            aria-label="Añadir clase (multiclase)"
            value=""
            disabled={!!bloqueoClaseActual}
            onChange={(e) => {
              const id = e.target.value;
              if (id) onAddClass(id);
            }}
          >
            <option value="">—</option>
            {!bloqueoClaseActual &&
              catalog.classes
                .filter((c) => !idsActuales.has(c.id))
                .map((c) => {
                  const bloqueo = validarRequisitosMulticlase(
                    [
                      ...character.identity.classes,
                      { classId: c.id, subclassId: null, level: 1 },
                    ],
                    character.abilities,
                  );
                  const req = textoRequisitoMulticlase(c.id);
                  return (
                    <option key={c.id} value={c.id} disabled={!!bloqueo}>
                      {catalog.t("classes", c.id, c.nameEn)}
                      {bloqueo ? ` · ${req}` : ""}
                    </option>
                  );
                })}
          </select>
          {bloqueoClaseActual && (
            <span className="truncate text-xs text-amber-200">{bloqueoClaseActual}</span>
          )}
        </label>
      )}
      {character.identity.classes.map((cl) => (
        <SubclassPicker
          key={cl.classId}
          compact
          catalog={catalog}
          classLevel={cl}
          classLabel={catalog.t("classes", cl.classId, cl.classId)}
          onChange={(subclassId) =>
            onChange({
              ...character,
              identity: {
                ...character.identity,
                classes: character.identity.classes.map((c) =>
                  c.classId === cl.classId ? { ...c, subclassId } : c,
                ),
                subclassId:
                  cl.classId === character.identity.classId
                    ? subclassId
                    : character.identity.subclassId,
              },
            })
          }
        />
      ))}
      {character.identity.classes.some(faltaElegirSubclase) && (
        <p className="text-xs text-amber-200">Falta elegir subclase (puedes abrir la ficha igual).</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        <span className="shrink-0 text-muted">Nivel</span>
        <NivelStepper
          value={character.identity.level}
          min={character.identity.classes.length}
          max={20}
          onDecrement={() => onLevelChange(-1)}
          onIncrement={() => onLevelChange(1)}
        />
      </div>
      <SpeciesPicker
        compact
        catalog={catalog}
        speciesId={character.identity.speciesId}
        className="sheet-select-compact min-w-[5.5rem]"
        onChange={(speciesId) => onOriginChange(speciesId, character.identity.backgroundId)}
      />
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="shrink-0 text-muted whitespace-nowrap">Trasfondo</span>
        <select
          className="sheet-select-compact min-w-[5.5rem]"
          value={character.identity.backgroundId ?? ""}
          onChange={(e) =>
            onOriginChange(character.identity.speciesId, e.target.value || null)
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
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="shrink-0 text-muted whitespace-nowrap">Jugador</span>
        <input
          className="sheet-input-compact w-[5.5rem] min-w-0"
          value={character.identity.playerName}
          placeholder="—"
          onChange={(e) =>
            onChange({
              ...character,
              identity: { ...character.identity, playerName: e.target.value },
            })
          }
        />
      </label>
    </div>
  );
}
