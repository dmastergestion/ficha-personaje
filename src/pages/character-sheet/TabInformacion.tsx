import { AddWeaponPanel } from "@/components/AddWeaponPanel";
import { ClassChoicesForm } from "@/components/ClassChoicesForm";
import { FeatPicker } from "@/components/FeatPicker";
import { SpellCatalogPanel } from "@/pages/character-sheet/SpellCatalogPanel";
import type { SheetTabProps } from "@/pages/character-sheet/types";
import { fusionarEleccionesClase, sincronizarCompetenciasOrdenDivino } from "@/rules/class-equipment";
import { origenCatalogoDesdeIds } from "@/rules/origin-benefits";
import { fusionarEleccionesOrigen } from "@/rules/origin-choices";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { conjurosOtorgadosLanzables } from "@/rules/spell-grants";
import { esLanzadorPersonaje } from "@/rules/spells";
import { useCatalogStore } from "@/stores/catalog-store";

export function TabInformacion({ character, onChange }: SheetTabProps) {
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
  const lanzador = esLanzadorPersonaje(character) || conjurosOtorgadosLanzables(character).length > 0;

  return (
    <div className="sheet-tab-stack">
      <p className="sheet-card text-sm text-muted">
        Catálogo de lo que aún no tienes. Lo que ya usas está en Combate, Hechizos, Equipo o Resumen.
      </p>

      {lanzador && <SpellCatalogPanel character={character} onChange={onChange} />}

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
          vista="catalogo"
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

      <FeatPicker character={character} onChange={onChange} modo="catalogo" />
      <AddWeaponPanel character={character} onChange={onChange} />
    </div>
  );
}
