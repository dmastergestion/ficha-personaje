import { useEffect, useMemo, useRef, useState } from "react";
import { FeatPicker } from "@/components/FeatPicker";
import { SpellChoicesForm } from "@/components/SpellChoicesForm";
import { SubclassPicker } from "@/components/SubclassPicker";
import { Button } from "@/components/layout";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import type { LevelUpExtras } from "@/hooks/useCharacterIdentityControls";
import { modificadorAtributo } from "@/rules/ability";
import { SKILL_LABELS_ES, ABILITY_LABELS_ES, esProficientePericia } from "@/rules/character";
import { periciasExpertiseAlNivel } from "@/rules/class-features";
import { tirarDadoDenominacion } from "@/rules/dice";
import { aplicarMejoraAtributos, type LevelUpPreview } from "@/rules/level-up";
import { faltaElegirSubclase } from "@/rules/multiclass";
import {
  deltaRequisitosSubida,
  validarDeltaConjuros,
  type SeleccionConjuros,
} from "@/rules/spell-choices";
import { idsConjurosAsignados } from "@/rules/spell-grants";
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
  onConfirm: (
    hpGain: number,
    addToCurrentHp: boolean,
    spellDelta: SeleccionConjuros,
    extras?: LevelUpExtras,
  ) => void;
  onCancel: () => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const [hpGain, setHpGain] = useState(preview.hpGain.average);
  const [hpRolled, setHpRolled] = useState<number | null>(null);
  const [addToCurrentHp, setAddToCurrentHp] = useState(true);
  const [spellDelta, setSpellDelta] = useState<SeleccionConjuros>(DELTA_VACIO);
  const [spellError, setSpellError] = useState<string | null>(null);
  const [subclassId, setSubclassId] = useState<string | null>(null);
  const [abilities, setAbilities] = useState(character.abilities);
  const [feats, setFeats] = useState(character.feats);
  const [expertise, setExpertise] = useState<SkillKey[]>([
    ...(character.proficiencies.expertise ?? []),
  ]);
  const [asiModo, setAsiModo] = useState<"asi" | "feat">("asi");
  const [asiA, setAsiA] = useState<AbilityKey>("str");
  const [asiB, setAsiB] = useState<AbilityKey>("dex");
  const [asiDos, setAsiDos] = useState(false);
  const spellSectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

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

  const pideAsi = preview.milestones.some((m) => /atributos|dote/i.test(m));
  const pideExpertise = periciasExpertiseAlNivel(preview.classId, preview.newClassLevel);
  const pideSubclase =
    faltaElegirSubclase({ ...claseSubida, subclassId: subclassId ?? claseSubida.subclassId }) ||
    preview.milestones.some((m) => /subclase/i.test(m));

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
    onConfirm(hpGain, addToCurrentHp, spellDelta, {
      abilities:
        pideAsi && asiModo === "asi"
          ? aplicarMejoraAtributos(abilities, asiA, asiB, asiDos)
          : abilities,
      feats,
      expertise,
      subclassId: subclassId ?? claseSubida.subclassId,
    });
  }

  function tirarVida() {
    const roll = tirarDadoDenominacion(preview.hpGain.die);
    const conPart = modificadorAtributo(character.abilities.con);
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
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-panel shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-white/10 px-4 py-3">
          <h2 id="level-up-title" className="text-lg font-bold">
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
                +{preview.pbBefore} → <span className="font-bold text-accent">+{preview.pbAfter}</span>
              </p>
            </section>
          )}

          <section className="rounded-lg bg-surface p-3">
            <h3 className="mb-1 font-semibold">Dado de golpe</h3>
            <p>+1{preview.hitDieAdded} (total dados: {preview.totalLevelAfter})</p>
          </section>

          {preview.milestones.length > 0 && (
            <section className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <h3 className="mb-2 font-semibold">Decisiones / hitos</h3>
              <ul className="list-inside list-disc space-y-1 text-xs">
                {preview.milestones.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          {pideSubclase && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">Subclase</h3>
              <SubclassPicker
                catalog={catalog}
                classLevel={{ ...claseSubida, subclassId: subclassId ?? claseSubida.subclassId }}
                subclassId={subclassId ?? claseSubida.subclassId}
                required
                onChange={setSubclassId}
              />
            </section>
          )}

          {pideAsi && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">Mejora de atributos o dote</h3>
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <Button
                  variant={asiModo === "asi" ? "primary" : "ghost"}
                  className="text-xs"
                  onClick={() => setAsiModo("asi")}
                >
                  ASI
                </Button>
                <Button
                  variant={asiModo === "feat" ? "primary" : "ghost"}
                  className="text-xs"
                  onClick={() => setAsiModo("feat")}
                >
                  Dote
                </Button>
              </div>
              {asiModo === "asi" ? (
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={asiDos}
                      onChange={(e) => setAsiDos(e.target.checked)}
                    />
                    +1 a dos atributos (si no, +2 a uno). Tope 20.
                  </label>
                  <label className="block">
                    Atributo A
                    <select
                      className="sheet-select mt-1"
                      value={asiA}
                      onChange={(e) => setAsiA(e.target.value as AbilityKey)}
                    >
                      {ABILITY_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {ABILITY_LABELS_ES[k]} ({abilities[k]})
                        </option>
                      ))}
                    </select>
                  </label>
                  {asiDos && (
                    <label className="block">
                      Atributo B
                      <select
                        className="sheet-select mt-1"
                        value={asiB}
                        onChange={(e) => setAsiB(e.target.value as AbilityKey)}
                      >
                        {ABILITY_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {ABILITY_LABELS_ES[k]} ({abilities[k]})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              ) : (
                <FeatPicker
                  character={{ ...character, abilities, feats }}
                  onChange={(next) => {
                    setFeats(next.feats);
                    setAbilities(next.abilities);
                  }}
                  modo="catalogo"
                />
              )}
            </section>
          )}

          {pideExpertise > 0 && (
            <section className="rounded-lg bg-surface p-3">
              <h3 className="mb-2 font-semibold">
                Expertise ({pideExpertise} pericias competentes)
              </h3>
              <ul className="space-y-1 text-xs">
                {(Object.keys(SKILL_LABELS_ES) as SkillKey[])
                  .filter((skill) => esProficientePericia(character, skill))
                  .map((skill) => (
                    <li key={skill}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={expertise.includes(skill)}
                          onChange={() => {
                            const has = expertise.includes(skill);
                            if (has) {
                              setExpertise(expertise.filter((s) => s !== skill));
                              return;
                            }
                            const nuevas = expertise.filter(
                              (s) => !character.proficiencies.expertise?.includes(s),
                            );
                            if (nuevas.length >= pideExpertise) return;
                            setExpertise([...expertise, skill]);
                          }}
                        />
                        {SKILL_LABELS_ES[skill]}
                      </label>
                    </li>
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
              className="scroll-mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3"
            >
              <h3 className="mb-2 font-semibold">Nuevos conjuros</h3>
              <SpellChoicesForm
                classes={[claseSubida]}
                seleccion={spellDelta}
                onChange={setSpellDelta}
                catalog={catalog}
                titulo="Añade los conjuros que ganas con este nivel"
                soloAnadir={deltaConjuros}
                grimorioBase={character.spells.spellsKnown}
                idsExcluidos={[...idsConjurosAsignados(character)]}
              />
              {spellError && <p className="mt-2 text-xs text-red-400">{spellError}</p>}
            </section>
          )}
        </div>

        <footer className="flex gap-2 border-t border-white/10 px-4 py-3">
          <Button autoFocus variant="ghost" className="flex-1" onClick={onCancel}>
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
