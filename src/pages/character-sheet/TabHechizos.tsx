import { Button } from "@/components/layout";
import { SPELL_SLOT_LEVELS } from "@/lib/constants";
import { espaciosMaximos, esLanzador } from "@/rules/spells";
import { ajustarEspacioUsado } from "@/rules/rests";
import { srdSpells, t } from "@/rules/srd";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useState } from "react";

export function TabHechizos({ character, onChange }: SheetTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const maxSlots = espaciosMaximos(character.identity.classId, character.identity.level);
  const lanzador = esLanzador(character.identity.classId);

  const filtrados = srdSpells
    .filter((s) => t("spells", s.id, s.nameEn).toLowerCase().includes(busqueda.toLowerCase()))
    .slice(0, 20);

  if (!lanzador) {
    return (
      <p className="rounded-xl border border-white/10 bg-panel p-4 text-muted">
        Esta clase no usa espacios de conjuro en v1.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-3 font-semibold">Espacios de conjuro</h3>
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

      <section className="rounded-xl border border-white/10 bg-panel p-4">
        <h3 className="mb-2 font-semibold">Conjuros conocidos</h3>
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
                    if (character.spells.spellsKnown.includes(spell.id)) return;
                    onChange({
                      ...character,
                      spells: {
                        ...character.spells,
                        spellsKnown: [...character.spells.spellsKnown, spell.id],
                      },
                    });
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
        <ul className="space-y-1">
          {character.spells.spellsKnown.map((id) => (
            <li key={id} className="flex items-center justify-between text-sm">
              <span>{t("spells", id, id)}</span>
              <Button
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...character,
                    spells: {
                      ...character.spells,
                      spellsKnown: character.spells.spellsKnown.filter((s) => s !== id),
                    },
                  })
                }
              >
                Quitar
              </Button>
            </li>
          ))}
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
