import { useState } from "react";
import {
  ajustarNivelTotal,
  sincronizarIdentidadMulticlase,
  validarClases,
} from "@/rules/multiclass";
import {
  aplicarBajadaNivel,
  aplicarSubidaNivel,
  detectarBajadaNivel,
  prepararSubidaNivel,
  type LevelUpPreview,
} from "@/rules/level-up";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { ajustarMaestriasArmas } from "@/rules/weapon-mastery";
import type { Character, ClassLevel } from "@/schemas/character";

export function useCharacterIdentityControls(
  character: Character,
  onChange: (next: Character) => void,
) {
  const [errorClases, setErrorClases] = useState<string | null>(null);
  const [levelUpPreview, setLevelUpPreview] = useState<LevelUpPreview | null>(null);
  const [pendingClasses, setPendingClasses] = useState<ClassLevel[] | null>(null);

  function aplicarClasesDirecto(classes: ClassLevel[]) {
    const msg = validarClases(classes);
    if (msg) {
      setErrorClases(msg);
      return false;
    }
    setErrorClases(null);
    const sync = sincronizarIdentidadMulticlase(classes);
    onChange(
      ajustarMaestriasArmas(
        poblarRecursosSugeridos({
          ...character,
          identity: { ...character.identity, ...sync },
          combat: { ...character.combat, hitDiceTotal: sync.level },
        }),
      ),
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

  function onClassChange(classId: string) {
    const current = character.identity.classes[0];
    if (!current || classId === current.classId) return;
    intentarCambioClases([
      { classId, subclassId: null, level: current.level },
    ]);
  }

  function onLevelChange(delta: -1 | 1) {
    const next = ajustarNivelTotal(character.identity.classes, delta);
    if (next) intentarCambioClases(next);
  }

  function confirmarSubidaNivel(
    hpGain: number,
    addToCurrentHp: boolean,
    spellDelta: { cantripsKnown: string[]; spellsKnown: string[]; spellsPrepared: string[] },
  ) {
    if (!pendingClasses) return;
    const msg = validarClases(pendingClasses);
    if (msg) {
      setErrorClases(msg);
      setLevelUpPreview(null);
      setPendingClasses(null);
      return;
    }
    setErrorClases(null);
    const subido = aplicarSubidaNivel(character, pendingClasses, hpGain, addToCurrentHp);
    onChange({
      ...subido,
      spells: {
        ...subido.spells,
        cantripsKnown: [...subido.spells.cantripsKnown, ...spellDelta.cantripsKnown],
        spellsKnown: [...subido.spells.spellsKnown, ...spellDelta.spellsKnown],
        spellsPrepared: [...subido.spells.spellsPrepared, ...spellDelta.spellsPrepared],
      },
    });
    setLevelUpPreview(null);
    setPendingClasses(null);
  }

  function cancelarSubidaNivel() {
    setLevelUpPreview(null);
    setPendingClasses(null);
  }

  return {
    errorClases,
    levelUpPreview,
    pendingClasses,
    onClassChange,
    onLevelChange,
    confirmarSubidaNivel,
    cancelarSubidaNivel,
  };
}
