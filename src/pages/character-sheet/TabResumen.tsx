import { useEffect, useRef } from "react";
import { AbilitySkillPanel } from "@/components/sheet/AbilitySkillPanel";
import { ProficienciesPanel } from "@/components/sheet/ProficienciesPanel";
import { SheetCard } from "@/components/sheet-ui";
import { ClassChoicesForm } from "@/components/ClassChoicesForm";
import { ClassFeaturesPanel } from "@/components/ClassFeaturesPanel";
import { FeatPicker } from "@/components/FeatPicker";
import { OriginChoicesForm } from "@/components/OriginChoicesForm";
import { BackgroundInfoPanel, SpeciesInfoPanel } from "@/components/OriginInfoPanel";
import { WeaponMasteryPanel } from "@/components/WeaponMasteryPanel";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import { fusionarEleccionesClase, sincronizarCompetenciasOrdenDivino } from "@/rules/class-equipment";
import { SKILL_ABILITIES, modificadorPericia, modificadorSalvacion } from "@/rules/character";
import { tiradaPericia, tiradaSalvacion } from "@/rules/effects";
import { desventajaPruebaCaracteristica } from "@/rules/proficiencies";
import { origenCatalogoDesdeIds } from "@/rules/origin-benefits";
import { fusionarEleccionesOrigen } from "@/rules/origin-choices";
import {
  aplicarEquipoTrasfondo,
  personajeNecesitaEquipoTrasfondo,
} from "@/rules/origin-equipment";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { ajustarMaestriasArmas } from "@/rules/weapon-mastery";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

export function TabResumen({ character, onChange }: SheetTabProps) {
  const catalog = useCatalogStore((s) => s.catalog);
  const catalogoOrigen = origenCatalogoDesdeIds(
    character.identity.speciesId,
    character.identity.backgroundId,
    catalog.obtenerEspecie.bind(catalog),
    catalog.obtenerTrasfondo.bind(catalog),
  );
  const originChoices = fusionarEleccionesOrigen(
    character.identity.speciesId,
    character.identity.backgroundId,
    character.originChoices,
    catalogoOrigen,
  );
  const classChoices = fusionarEleccionesClase(
    character.identity.classId,
    originChoices,
    {
      classes: character.identity.classes,
      classLevel: character.identity.level,
      trucosConocidos: character.spells.cantripsKnown,
    },
  );
  const equipoSyncRef = useRef<string | null>(null);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  useEffect(() => {
    if (equipoSyncRef.current === character.id) return;
    if (!personajeNecesitaEquipoTrasfondo(character)) return;
    equipoSyncRef.current = character.id;
    onChange(aplicarEquipoTrasfondo(character, catalogoOrigen));
  }, [character, catalogoOrigen, onChange]);

  function actualizarEleccionesOrigen(next: typeof originChoices) {
    onChange(
      poblarRecursosSugeridos(
        aplicarEquipoTrasfondo({ ...character, originChoices: next }, catalogoOrigen),
      ),
    );
  }

  function tirarAtributoRoll(_key: AbilityKey, mod: number) {
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
      {
        desventaja: desventajaPruebaCaracteristica(character, _key),
        ventaja: character.combat.raging && _key === "str",
      },
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimaTirada(result);
  }

  function tirarSalvacionRoll(key: AbilityKey) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const mod = modificadorSalvacion(character, key);
    const result = tiradaSalvacion(
      mod,
      key,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      diceRoll.options,
      { desventaja: desventajaPruebaCaracteristica(character, key), ventaja: character.combat.raging && key === "str" },
    );
    if ("autoFallo" in result) {
      if (result.razon.includes("dado")) {
        setUltimaTirada(null, result.razon);
        return;
      }
      setUltimaTirada({
        mode: "normal",
        rolls: [1],
        used: 1,
        modifier: mod,
        total: 1 + mod,
        isCritical: false,
        isFumble: true,
        source: diceRoll.options.source ?? "virtual",
      });
      return;
    }
    setUltimaTirada(result);
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
      {
        desventaja: desventajaPruebaCaracteristica(character, SKILL_ABILITIES[skill], skill),
        ventaja: character.combat.raging && skill === "athletics",
      },
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimaTirada(result);
  }

  return (
    <div className="sheet-tab-stack xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start xl:gap-3">
      <div className="flex flex-col gap-3">
        <SheetCard>
          <AbilitySkillPanel
            character={character}
            onChange={onChange}
            onRollAbility={tirarAtributoRoll}
            onRollSave={tirarSalvacionRoll}
            onRollSkill={tirarPericiaRoll}
          />
        </SheetCard>
        <ProficienciesPanel character={character} onChange={onChange} />
        <OriginChoicesForm
          speciesId={character.identity.speciesId}
          backgroundId={character.identity.backgroundId}
          level={character.identity.level}
          catalogo={catalogoOrigen}
          choices={originChoices}
          mode="sheet"
          omitirBonificacionAtributos
          onChange={actualizarEleccionesOrigen}
        />

        {character.identity.classes.map((cl) => (
          <ClassChoicesForm
            key={cl.classId}
            classId={cl.classId}
            classes={character.identity.classes}
            level={cl.level}
            choices={classChoices}
            catalog={catalog}
            mode="sheet"
            omitirEquipo
            vista="uso"
            trucosConocidos={character.spells.cantripsKnown}
            onChange={(next) =>
              onChange(
                poblarRecursosSugeridos(
                  sincronizarCompetenciasOrdenDivino({ ...character, originChoices: next }),
                ),
              )
            }
          />
        ))}

        <FeatPicker character={character} onChange={onChange} modo="uso" />

        <WeaponMasteryPanel
          character={character}
          onChange={(next) => onChange(ajustarMaestriasArmas(next))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="sheet-section-title mb-0 text-muted">Rasgos</h3>

        {character.identity.speciesId && catalog.obtenerEspecie(character.identity.speciesId) && (
          <SpeciesInfoPanel
            species={catalog.obtenerEspecie(character.identity.speciesId)!}
            name={catalog.t("species", character.identity.speciesId, character.identity.speciesId)}
            speciesId={character.identity.speciesId}
            level={character.identity.level}
            catalogo={{
              species: catalog.obtenerEspecie(character.identity.speciesId),
              background: character.identity.backgroundId
                ? catalog.obtenerTrasfondo(character.identity.backgroundId)
                : undefined,
            }}
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
              backgroundId={character.identity.backgroundId}
              catalogo={catalogoOrigen}
              elecciones={originChoices}
              detalleDote={false}
            />
          )}

        <ClassFeaturesPanel classes={character.identity.classes} />
      </div>
    </div>
  );
}
