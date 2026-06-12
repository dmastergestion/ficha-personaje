import { useEffect, useMemo, useRef, useState } from "react";
import { SpellChoicesForm } from "@/components/SpellChoicesForm";
import { Button } from "@/components/layout";
import { tirarDadoDenominacion } from "@/rules/dice";
import type { LevelUpPreview } from "@/rules/level-up";
import {
  deltaRequisitosSubida,
  validarDeltaConjuros,
  type SeleccionConjuros,
} from "@/rules/spell-choices";
import type { ClassLevel, Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";

const DELTA_VACIO: SeleccionConjuros = {
  cantripsKnown: [],
  spellsKnown: [],
  spellsPrepared: [],
};

export function LevelUpModal({
  preview,
  character,
  pendingClasses,
  onConfirm,
  onCancel,
}: {
  preview: LevelUpPreview;
  character: Character;
  pendingClasses: ClassLevel[];
  onConfirm: (hpGain: number, addToCurrentHp: boolean, spellDelta: SeleccionConjuros) => void;
  onCancel: () => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const [hpGain, setHpGain] = useState(preview.hpGain.average);
  const [hpRolled, setHpRolled] = useState<number | null>(null);
  const [addToCurrentHp, setAddToCurrentHp] = useState(true);
  const [spellDelta, setSpellDelta] = useState<SeleccionConjuros>(DELTA_VACIO);
  const [spellError, setSpellError] = useState<string | null>(null);
  const spellSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (spellError && spellSectionRef.current) {
      spellSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [spellError]);

  const deltaConjuros = useMemo(
    () => deltaRequisitosSubida(character.identity.classes, pendingClasses),
    [character.identity.classes, pendingClasses],
  );

  const claseSubida = useMemo(
    () => pendingClasses.find((c) => c.classId === preview.classId) ?? pendingClasses[0]!,
    [pendingClasses, preview.classId],
  );

  const requiereConjuros =
    deltaConjuros.cantrips > 0 || deltaConjuros.grimorio > 0 || deltaConjuros.preparados > 0;

  function confirmar() {
    if (requiereConjuros) {
      const msg = validarDeltaConjuros(
        deltaConjuros,
        spellDelta,
        character.spells.spellsKnown,
      );
      if (msg) {
        setSpellError(msg);
        return;
      }
    }
    setSpellError(null);
    onConfirm(hpGain, addToCurrentHp, spellDelta);
  }

  function tirarVida() {
    const match = /^d(\d+)$/i.exec(preview.hpGain.die.trim());
    const sides = match ? Number.parseInt(match[1] ?? "8", 10) : 8;
    const roll = tirarDadoDenominacion(preview.hpGain.die);
    const conPart = preview.hpGain.maximum - sides; // modificador CON
    const total = Math.max(1, roll + conPart);
    setHpRolled(roll);
    setHpGain(total);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-panel shadow-xl">
        <header className="border-b border-white/10 px-4 py-3">
          <h2 id="level-up-title" className="text-lg font-bold text-gold">
            ¡Subes de nivel!
          </h2>
          <p className="text-sm text-muted">
            {preview.className} {preview.newClassLevel} · Total {preview.totalLevelBefore} →{" "}
            {preview.totalLevelAfter}
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-sm">
          <section className="rounded-lg bg-surface p-3">
            <h3 className="mb-2 font-semibold">Puntos de golpe</h3>
            <p className="text-muted">
              {preview.hpGain.die} + CON
              {!preview.hpGain.isFirstLevelInClass &&
                ` · promedio ${preview.hpGain.average}`}
            </p>
            <label className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-muted">+</span>
              <input
                type="number"
                min={1}
                className="sheet-input-compact w-20 tabular-nums"
                value={hpGain}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) {
                    setHpGain(Math.max(1, Math.floor(n)));
                    setHpRolled(null);
                  }
                }}
              />
              <span className="text-muted">PV máx.</span>
            </label>
            {hpRolled !== null && (
              <p className="mt-1 text-xs text-muted">
                Tirada: {hpRolled} en {preview.hpGain.die} + CON
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setHpGain(preview.hpGain.average);
                  setHpRolled(null);
                }}
              >
                Promedio ({preview.hpGain.average})
              </Button>
              <Button variant="combat" className="text-xs" onClick={tirarVida}>
                Tirar {preview.hpGain.die}
              </Button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={addToCurrentHp}
                onChange={(e) => setAddToCurrentHp(e.target.checked)}
              />
              Sumar también a PV actuales
            </label>
          </section>

          {preview.pbBefore !== preview.pbAfter && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="font-semibold">Bonificador de competencia</h3>
              <p>
                +{preview.pbBefore} → <span className="font-bold text-gold">+{preview.pbAfter}</span>
              </p>
            </section>
          )}

          <section className="rounded-lg bg-surface p-3">
            <h3 className="mb-1 font-semibold">Dado de golpe</h3>
            <p>+1{preview.hitDieAdded} (total dados: {preview.totalLevelAfter})</p>
          </section>

          {preview.milestones.length > 0 && (
            <section className="rounded-lg border border-gold/30 bg-gold/5 p-3">
              <h3 className="mb-2 font-semibold text-gold">Decisiones / hitos</h3>
              <ul className="list-inside list-disc space-y-1 text-xs">
                {preview.milestones.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          {preview.features.length > 0 && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">Nuevos rasgos</h3>
              <ul className="space-y-2">
                {preview.features.map((f) => (
                  <li key={f.name} className="rounded border border-white/5 p-2 text-xs">
                    <span className="font-semibold">{f.name}</span>
                    <p className="mt-0.5 text-muted">{f.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {preview.spellSlots && preview.spellSlots.length > 0 && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">Espacios de conjuro</h3>
              <ul className="space-y-1 text-xs">
                {preview.spellSlots.map((s) => (
                  <li key={s.level}>
                    Nivel {s.level}: {s.before} → <span className="font-bold">{s.after}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {preview.pactSlots && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="font-semibold">Magia de pacto</h3>
              <p className="text-xs">
                {preview.pactSlots.before} → {preview.pactSlots.after} espacios de nivel{" "}
                {preview.pactSlots.slotLevel}
              </p>
            </section>
          )}

          {preview.cantrips && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="font-semibold">Trucos conocidos</h3>
              <p className="text-xs">
                {preview.cantrips.before} → {preview.cantrips.after}
              </p>
            </section>
          )}

          {preview.prepared && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="font-semibold">Conjuros preparados (máx.)</h3>
              <p className="text-xs">
                {preview.prepared.before} → {preview.prepared.after}
              </p>
            </section>
          )}

          {preview.resources.length > 0 && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">Recursos</h3>
              <ul className="space-y-1 text-xs">
                {preview.resources.map((r) => (
                  <li key={r.name}>
                    {r.name}: {r.before} → <span className="font-bold">{r.after}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {requiereConjuros && (
            <section
              ref={spellSectionRef}
              className="scroll-mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3"
            >
              <h3 className="mb-2 font-semibold text-gold">Nuevos conjuros</h3>
              <SpellChoicesForm
                classes={[claseSubida]}
                seleccion={spellDelta}
                onChange={setSpellDelta}
                catalog={catalog}
                titulo="Añade los conjuros que ganas con este nivel"
                soloAnadir={deltaConjuros}
                grimorioBase={character.spells.spellsKnown}
              />
              {spellError && <p className="mt-2 text-xs text-red-400">{spellError}</p>}
            </section>
          )}
        </div>

        <footer className="flex gap-2 border-t border-white/10 px-4 py-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={confirmar}>
            Aplicar nivel {preview.totalLevelAfter}
          </Button>
        </footer>
      </div>
    </div>
  );
}
