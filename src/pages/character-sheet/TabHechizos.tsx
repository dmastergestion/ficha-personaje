import { useState } from "react";
import { Button } from "@/components/layout";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import {
  espaciosMaximosPersonaje,
  espaciosPactoMaximos,
  esLanzadorPersonaje,
  nivelBrujo,
  nivelEfectivoConjuro,
  usaPreparadosMulticlase,
} from "@/rules/spells";
import { tirarD20 } from "@/rules/dice";
import { ajustarEspacioUsado, ajustarPactoUsado } from "@/rules/rests";
import { srdSpells, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useUiStore } from "@/stores/ui-store";

function agregarConjuro(
  character: SheetTabProps["character"],
  spellId: string,
  level: number,
): SheetTabProps["character"] {
  if (level === 0) {
    if (character.spells.cantripsKnown.includes(spellId)) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: [...character.spells.cantripsKnown, spellId],
      },
    };
  }

  if (usaPreparadosMulticlase(character.identity.classes)) {
    if (character.spells.spellsPrepared.includes(spellId)) return character;
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: [...character.spells.spellsPrepared, spellId],
      },
    };
  }

  if (character.spells.spellsKnown.includes(spellId)) return character;
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: [...character.spells.spellsKnown, spellId],
    },
  };
}

function quitarConjuro(
  character: SheetTabProps["character"],
  spellId: string,
  list: "cantrips" | "known" | "prepared",
): SheetTabProps["character"] {
  if (list === "cantrips") {
    return {
      ...character,
      spells: {
        ...character.spells,
        cantripsKnown: character.spells.cantripsKnown.filter((s) => s !== spellId),
      },
    };
  }
  if (list === "prepared") {
    return {
      ...character,
      spells: {
        ...character.spells,
        spellsPrepared: character.spells.spellsPrepared.filter((s) => s !== spellId),
      },
    };
  }
  return {
    ...character,
    spells: {
      ...character.spells,
      spellsKnown: character.spells.spellsKnown.filter((s) => s !== spellId),
    },
  };
}

function SpellRow({
  id,
  onRemove,
  onCast,
}: {
  id: string;
  onRemove: () => void;
  onCast: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span>{t("spells", id, id)}</span>
      <div className="flex gap-1">
        <Button variant="critical" onClick={onCast}>
          Lanzar
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          Quitar
        </Button>
      </div>
    </li>
  );
}

export function TabHechizos({ character, onChange }: SheetTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const maxSlots = espaciosMaximosPersonaje(character);
  const lanzador = esLanzadorPersonaje(character);
  const preparados = usaPreparadosMulticlase(character.identity.classes);
  const pactMax = espaciosPactoMaximos(character.identity.classes);
  const pactUsed = character.spells.pactMagicUsed ?? 0;
  const rollMode = useUiStore((s) => s.rollMode);
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  const filtrados = srdSpells
    .filter((s) => t("spells", s.id, s.nameEn).toLowerCase().includes(busqueda.toLowerCase()))
    .slice(0, 20);

  if (!lanzador) {
    return (
      <p className="rounded-xl border border-white/10 bg-panel p-4 text-muted">
        Este personaje no usa conjuros.
      </p>
    );
  }

  const effectiveLevel = nivelEfectivoConjuro(character.identity.classes);

  return (
    <div className="space-y-4">
      {effectiveLevel > 0 && (
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h3 className="mb-3 font-semibold">
            Espacios de conjuro (nivel efectivo {effectiveLevel})
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SPELL_SLOT_LEVELS.map((level) => {
              if (maxSlots[level] === 0) return null;
              const usados = character.spells.spellSlotsUsed[level];
              return (
                <div key={level} className="rounded-lg bg-surface p-2 text-center text-sm">
                  <div className="text-muted">Niv {level}</div>
                  <div className="text-lg font-bold">
                    {usados}/{maxSlots[level]}
                  </div>
                  <div className="mt-1 flex justify-center gap-1">
                    <Button
                      variant="critical"
                      onClick={() => onChange(ajustarEspacioUsado(character, level, 1))}
                    >
                      +
                    </Button>
                    <Button onClick={() => onChange(ajustarEspacioUsado(character, level, -1))}>
                      −
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pactMax > 0 && (
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h3 className="mb-3 font-semibold">
            Magia de pacto (brujo {nivelBrujo(character.identity.classes)})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">
              {pactUsed}/{pactMax}
            </span>
            <Button variant="critical" onClick={() => onChange(ajustarPactoUsado(character, 1))}>
              +
            </Button>
            <Button onClick={() => onChange(ajustarPactoUsado(character, -1))}>−</Button>
          </div>
        </section>
      )}

      {character.spells.abilityKey && (
        <p className="text-xs text-muted">
          Atributo de conjuro: {character.spells.abilityKey.toUpperCase()}
        </p>
      )}

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-2 font-semibold">Buscar conjuro SRD</h3>
        <input
          className="mb-2 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
          placeholder="Buscar conjuro SRD…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <ul className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-white/10">
            {filtrados.map((spell) => (
              <li key={spell.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    onChange(agregarConjuro(character, spell.id, spell.level));
                    setBusqueda("");
                  }}
                >
                  {t("spells", spell.id, spell.nameEn)}{" "}
                  <span className="text-muted">
                    ({spell.level === 0 ? "truco" : `niv ${spell.level}`})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-2 font-semibold">Trucos</h3>
        <ul className="space-y-1">
          {character.spells.cantripsKnown.map((id) => (
            <SpellRow
              key={id}
              id={id}
              onRemove={() => onChange(quitarConjuro(character, id, "cantrips"))}
              onCast={() => setUltimaTirada(tirarD20(0, rollMode))}
            />
          ))}
          {character.spells.cantripsKnown.length === 0 && (
            <li className="text-sm text-muted">Sin trucos añadidos.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-2 font-semibold">
          {preparados ? "Conjuros preparados" : "Conjuros conocidos"}
        </h3>
        <ul className="space-y-1">
          {(preparados ? character.spells.spellsPrepared : character.spells.spellsKnown).map(
            (id) => (
              <SpellRow
                key={id}
                id={id}
                onRemove={() =>
                  onChange(quitarConjuro(character, id, preparados ? "prepared" : "known"))
                }
                onCast={() => setUltimaTirada(tirarD20(0, rollMode))}
              />
            ),
          )}
          {(preparados ? character.spells.spellsPrepared : character.spells.spellsKnown)
            .length === 0 && <li className="text-sm text-muted">Sin conjuros añadidos.</li>}
        </ul>
      </section>
    </div>
  );
}

export function TabNotas({ character, onChange }: SheetTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <textarea
        className="min-h-48 w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
        placeholder="Notas, homebrew, rasgos de campaña…"
        value={character.notes}
        onChange={(e) => onChange({ ...character, notes: e.target.value })}
      />
    </div>
  );
}
