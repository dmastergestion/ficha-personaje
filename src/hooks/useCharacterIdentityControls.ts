import { useState } from "react";
import type { SkillKey } from "@/lib/constants";
import { aplicarEquipoClase } from "@/rules/class-equipment";
import {
  aplicarBajadaNivel,
  aplicarSubidaNivel,
  detectarBajadaNivel,
  prepararSubidaNivel,
  type LevelUpPreview,
} from "@/rules/level-up";
import {
  ajustarNivelTotal,
  agregarClase,
  sincronizarIdentidadMulticlase,
  validarClases,
  validarRequisitosMulticlase,
} from "@/rules/multiclass";
import { competenciasClase, SALVACIONES_CLASE } from "@/rules/proficiencies";
import type { GameCatalog } from "@/rules/catalog";
import { origenCatalogoDesdeIds } from "@/rules/origin-benefits";
import { reaplicarOrigen, resumenCambioOrigen } from "@/rules/origin-reapply";
import { ajustarPgPorCambioCon, sincronizarPgPorDotes } from "@/rules/resources";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { ajustarMaestriasArmas } from "@/rules/weapon-mastery";
import type { Character, CharacterFeat, ClassLevel } from "@/schemas/character";

export type LevelUpExtras = {
  abilities?: Character["abilities"];
  feats?: CharacterFeat[];
  expertise?: SkillKey[];
  subclassId?: string | null;
};

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
    if (
      !window.confirm(
        "¿Cambiar de clase? Se reiniciarán elecciones de clase, maestrías, listas de conjuros y subclase. Los ASI ya aplicados no se tocan.",
      )
    ) {
      return;
    }
    const classes: ClassLevel[] = [{ classId, subclassId: null, level: current.level }];
    const msg = validarClases(classes);
    if (msg) {
      setErrorClases(msg);
      return;
    }
    setErrorClases(null);
    const sync = sincronizarIdentidadMulticlase(classes);
    const classProf = competenciasClase(classId);
    const oldClassTools = new Set(competenciasClase(current.classId).toolProficiencies);
    const keptTools = character.proficiencies.toolProficiencies.filter(
      (t) => !oldClassTools.has(t),
    );
    const next: Character = {
      ...character,
      identity: { ...character.identity, ...sync },
      originChoices: { ...character.originChoices, class: {} },
      weaponMasteries: [],
      proficiencies: {
        ...character.proficiencies,
        savingThrows: [...(SALVACIONES_CLASE[classId] ?? [])],
        armorProficiencies: [...classProf.armorProficiencies],
        weaponProficiencies: [...classProf.weaponProficiencies],
        toolProficiencies: [...new Set([...classProf.toolProficiencies, ...keptTools])],
      },
      spells: {
        ...character.spells,
        cantripsKnown: [],
        spellsKnown: [],
        spellsPrepared: [],
      },
      combat: { ...character.combat, hitDiceTotal: sync.level },
    };
    onChange(ajustarMaestriasArmas(poblarRecursosSugeridos(aplicarEquipoClase(next))));
  }

  function onOriginChange(
    speciesId: string | null,
    backgroundId: string | null,
    catalog: GameCatalog,
  ) {
    const catalogo = origenCatalogoDesdeIds(
      speciesId,
      backgroundId,
      catalog.obtenerEspecie.bind(catalog),
      catalog.obtenerTrasfondo.bind(catalog),
    );
    const resumen = resumenCambioOrigen(character, speciesId, backgroundId, catalogo);
    if (
      !window.confirm(
        `Al cambiar especie o trasfondo se reaplican dote, ASI, idiomas y PG de origen.\n\n${resumen}\n\n¿Continuar?`,
      )
    ) {
      return;
    }
    onChange(reaplicarOrigen(character, speciesId, backgroundId, catalogo));
  }

  function onAddClass(classId: string) {
    const next = agregarClase(character.identity.classes, classId);
    if (!next) {
      setErrorClases("No se puede añadir esa clase (ya la tienes o el nivel total es 20).");
      return;
    }
    const req = validarRequisitosMulticlase(next, character.abilities);
    if (req) {
      setErrorClases(req);
      return;
    }
    intentarCambioClases(next);
  }

  function onLevelChange(delta: -1 | 1) {
    const next = ajustarNivelTotal(character.identity.classes, delta);
    if (next) intentarCambioClases(next);
  }

  function confirmarSubidaNivel(
    hpGain: number,
    addToCurrentHp: boolean,
    spellDelta: { cantripsKnown: string[]; spellsKnown: string[]; spellsPrepared: string[] },
    extras?: LevelUpExtras,
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
    const classId = levelUpPreview?.classId;
    const classes =
      extras?.subclassId !== undefined && classId
        ? pendingClasses.map((c) =>
            c.classId === classId ? { ...c, subclassId: extras.subclassId ?? null } : c,
          )
        : pendingClasses;
    const subido = aplicarSubidaNivel(character, classes, hpGain, addToCurrentHp);
    let next: Character = {
      ...subido,
      abilities: extras?.abilities ?? subido.abilities,
      feats: extras?.feats ?? subido.feats,
      proficiencies: {
        ...subido.proficiencies,
        expertise: extras?.expertise ?? subido.proficiencies.expertise,
      },
      spells: {
        ...subido.spells,
        cantripsKnown: [...subido.spells.cantripsKnown, ...spellDelta.cantripsKnown],
        spellsKnown: [...subido.spells.spellsKnown, ...spellDelta.spellsKnown],
        spellsPrepared: [...subido.spells.spellsPrepared, ...spellDelta.spellsPrepared],
      },
    };
    if (extras?.abilities && extras.abilities.con !== character.abilities.con) {
      next = ajustarPgPorCambioCon(next, character.abilities.con, extras.abilities.con);
    }
    if (extras?.feats) {
      next = sincronizarPgPorDotes(subido, next);
    }
    onChange(next);
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
    onAddClass,
    onOriginChange,
    onLevelChange,
    confirmarSubidaNivel,
    cancelarSubidaNivel,
  };
}
