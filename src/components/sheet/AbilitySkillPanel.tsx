import { Button } from "@/components/layout";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import {
  ABILITY_SHEET_COLUMNS,
  etiquetaAtributoOficial,
  etiquetaPericiaOficial,
  SKILLS_BY_ABILITY,
} from "@/lib/sheet-layout";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { modificadorPericia, modificadorSalvacion, tieneExpertisePericia, esProficientePericia } from "@/rules/character";
import { periciasExtraDotes } from "@/rules/feat-mechanics";
import { ajustarPgPorCambioCon } from "@/rules/resources";
import type { Character } from "@/schemas/character";

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

export function AbilitySkillPanel({
  character,
  onChange,
  onRollAbility,
  onRollSave,
  onRollSkill,
  editableScores = true,
}: {
  character: Character;
  onChange: (next: Character) => void;
  onRollAbility: (key: AbilityKey, mod: number) => void;
  onRollSave: (key: AbilityKey) => void;
  onRollSkill: (skill: SkillKey) => void;
  editableScores?: boolean;
}) {
  const pb = bonificadorCompetencia(character.identity.level);

  function toggleSave(key: AbilityKey) {
    const savingThrows = character.proficiencies.savingThrows.includes(key)
      ? character.proficiencies.savingThrows.filter((k) => k !== key)
      : [...character.proficiencies.savingThrows, key];
    onChange({
      ...character,
      proficiencies: { ...character.proficiencies, savingThrows },
    });
  }

  function toggleSkill(skill: SkillKey) {
    const proficient = character.proficiencies.skills.includes(skill);
    const overrides = { ...character.proficiencies.skillOverrides };
    delete overrides[skill];
    const skills = proficient
      ? character.proficiencies.skills.filter((s) => s !== skill)
      : [...character.proficiencies.skills, skill];
    const expertise = proficient
      ? (character.proficiencies.expertise ?? []).filter((s) => s !== skill)
      : (character.proficiencies.expertise ?? []);
    onChange({
      ...character,
      proficiencies: { ...character.proficiencies, skills, skillOverrides: overrides, expertise },
    });
  }

  function toggleExpertise(skill: SkillKey) {
    if (!esProficiente(skill)) return;
    const current = character.proficiencies.expertise ?? [];
    const expertise = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    onChange({
      ...character,
      proficiencies: { ...character.proficiencies, expertise },
    });
  }

  function esProficiente(skill: SkillKey): boolean {
    return esProficientePericia(character, skill);
  }

  function periciaDeDote(skill: SkillKey): boolean {
    return periciasExtraDotes(character).includes(skill);
  }

  return (
    <div className="sheet-pdf-abilities">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="sheet-section-title mb-0">Atributos y pericias</h3>
        <span className="text-xs text-muted">PB {fmtMod(pb)}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ABILITY_SHEET_COLUMNS.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-2">
            {column.map((ability) => {
              const score = character.abilities[ability];
              const mod = modificadorAtributo(score);
              const saveMod = modificadorSalvacion(character, ability);
              const saveProf = character.proficiencies.savingThrows.includes(ability);
              const skills = SKILLS_BY_ABILITY[ability];

              return (
                <div key={ability} className="sheet-ability-cluster">
                  <div className="flex items-start gap-2">
                    <div className="sheet-ability-bubble">
                      <span className="sheet-ability-name">{etiquetaAtributoOficial(ability)}</span>
                      {editableScores ? (
                        <input
                          type="number"
                          min={1}
                          max={30}
                          className="sheet-ability-score"
                          value={score}
                          aria-label={etiquetaAtributoOficial(ability)}
                          onChange={(e) => {
                            const nextScore = Math.min(
                              30,
                              Math.max(1, Number(e.target.value) || 10),
                            );
                            const withScore = {
                              ...character,
                              abilities: {
                                ...character.abilities,
                                [ability]: nextScore,
                              },
                            };
                            onChange(
                              ability === "con"
                                ? ajustarPgPorCambioCon(withScore, score, nextScore)
                                : withScore,
                            );
                          }}
                        />
                      ) : (
                        <span className="sheet-ability-score">{score}</span>
                      )}
                      <Button
                        variant="combat"
                        className="sheet-ability-mod-btn"
                        onClick={() => onRollAbility(ability, mod)}
                      >
                        {fmtMod(mod)}
                      </Button>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="sheet-save-row">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={saveProf}
                            onChange={() => toggleSave(ability)}
                            aria-label={`Competencia en salvación de ${etiquetaAtributoOficial(ability)}`}
                          />
                          <span className="text-muted">Salv.</span>
                        </label>
                        <Button
                          variant="combat"
                          className="px-2 py-0.5 text-xs"
                          onClick={() => onRollSave(ability)}
                        >
                          {fmtMod(saveMod)}
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {skills.map((skill) => {
                            const proficient = esProficiente(skill);
                            const expertise = tieneExpertisePericia(character, skill);
                            const skillMod = modificadorPericia(character, skill);
                            return (
                              <li key={skill} className="sheet-skill-row">
                                <label className="flex min-w-0 flex-1 items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={proficient}
                                    disabled={periciaDeDote(skill)}
                                    onChange={() => toggleSkill(skill)}
                                    aria-label={`Competencia en ${etiquetaPericiaOficial(skill)}`}
                                    title={
                                      periciaDeDote(skill)
                                        ? "Competencia de la dote Hábil"
                                        : undefined
                                    }
                                  />
                                  <input
                                    type="checkbox"
                                    className="accent-gold"
                                    checked={expertise}
                                    disabled={!proficient}
                                    onChange={() => toggleExpertise(skill)}
                                    aria-label={`Expertise en ${etiquetaPericiaOficial(skill)}`}
                                    title="Expertise (doble PB)"
                                  />
                                  <span
                                    className={`truncate text-sm ${proficient ? "font-medium" : "text-muted"}`}
                                  >
                                    {etiquetaPericiaOficial(skill)}
                                    {expertise ? " ★" : ""}
                                  </span>
                                </label>
                                <Button
                                  variant="combat"
                                  className="shrink-0 px-2 py-0.5 text-xs"
                                  onClick={() => onRollSkill(skill)}
                                >
                                  {fmtMod(skillMod)}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
