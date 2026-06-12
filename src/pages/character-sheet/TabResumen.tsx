import { useEffect, useRef } from "react";
import { ClassFeaturesPanel } from "@/components/ClassFeaturesPanel";
import { WeaponMasteryPanel } from "@/components/WeaponMasteryPanel";
import { OriginChoicesForm } from "@/components/OriginChoicesForm";
import { BackgroundInfoPanel, SpeciesInfoPanel } from "@/components/OriginInfoPanel";
import { Button } from "@/components/layout";
import { SheetCard } from "@/components/sheet-ui";
import { AbilitySkillPanel } from "@/components/sheet/AbilitySkillPanel";
import type { AbilityKey, SkillKey } from "@/lib/constants";
import { modificadorPericia, modificadorSalvacion } from "@/rules/character";
import { tiradaPericia, tiradaSalvacion } from "@/rules/effects";
import { descripcionDadosGolpe } from "@/rules/multiclass";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { SHEET_TABS } from "@/pages/character-sheet/types";
import { useCatalogStore } from "@/stores/catalog-store";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useUiStore } from "@/stores/ui-store";
import { origenCatalogoDesdeIds } from "@/rules/origin-benefits";
import { fusionarEleccionesOrigen } from "@/rules/origin-choices";
import {
  aplicarEquipoTrasfondo,
  personajeNecesitaEquipoTrasfondo,
} from "@/rules/origin-equipment";
import { ajustarMaestriasArmas } from "@/rules/weapon-mastery";

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
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const equipoSyncRef = useRef<string | null>(null);

  useEffect(() => {
    if (equipoSyncRef.current === character.id) return;
    if (!personajeNecesitaEquipoTrasfondo(character)) return;
    equipoSyncRef.current = character.id;
    onChange(aplicarEquipoTrasfondo(character, catalogoOrigen));
  }, [character, catalogoOrigen, onChange]);

  function actualizarEleccionesOrigen(next: typeof originChoices) {
    onChange(
      aplicarEquipoTrasfondo(
        { ...character, originChoices: next },
        catalogoOrigen,
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
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimaTirada(result);
  }

  return (
    <div className="sheet-tab-stack">
      <SheetCard>
        <AbilitySkillPanel
          character={character}
          onChange={onChange}
          onRollAbility={tirarAtributoRoll}
          onRollSave={tirarSalvacionRoll}
          onRollSkill={tirarPericiaRoll}
        />
      </SheetCard>

      <div className="sheet-tab-stack">
      <p className="text-sm text-muted">
        Dados de golpe: {descripcionDadosGolpe(character.identity.classes)}
      </p>

      <OriginChoicesForm
        speciesId={character.identity.speciesId}
        backgroundId={character.identity.backgroundId}
        level={character.identity.level}
        catalogo={catalogoOrigen}
        choices={originChoices}
        mode="sheet"
        onChange={actualizarEleccionesOrigen}
      />

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
          />
        )}

      <ClassFeaturesPanel classes={character.identity.classes} />

      <WeaponMasteryPanel
        character={character}
        onChange={(next) => onChange(ajustarMaestriasArmas(next))}
      />
      </div>
    </div>
  );
}

export function SheetTabBar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="sheet-tab-bar" aria-label="Secciones de la ficha">
      {SHEET_TABS.map(({ id, label }) => (
        <Button
          key={id}
          variant="ghost"
          className={active === id ? "sheet-tab sheet-tab-active" : "sheet-tab"}
          onClick={() => onSelect(id)}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}
