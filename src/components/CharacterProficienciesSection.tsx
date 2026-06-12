import { SheetCard } from "@/components/sheet-ui";
import {
  etiquetaCompetenciaArmadura,
  etiquetaCompetenciaArma,
  etiquetaListaCompetenciasHerramientas,
} from "@/rules/proficiencies";
import type { Character } from "@/schemas/character";

export function CharacterCompetenciesSection({ character }: { character: Character }) {  const { armorProficiencies, weaponProficiencies, toolProficiencies } = character.proficiencies;
  const empty =
    armorProficiencies.length === 0 &&
    weaponProficiencies.length === 0 &&
    toolProficiencies.length === 0;

  return (
    <SheetCard title="Competencias">
      {armorProficiencies.length > 0 && (
        <p className="text-sm text-muted">
          <span className="font-medium text-white">Armaduras:</span>{" "}
          {armorProficiencies.map(etiquetaCompetenciaArmadura).join(", ")}
        </p>
      )}
      {weaponProficiencies.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-white">Armas:</span>{" "}
          {weaponProficiencies.map(etiquetaCompetenciaArma).join(", ")}
        </p>
      )}
      {toolProficiencies.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-white">Herramientas:</span>{" "}
          {etiquetaListaCompetenciasHerramientas(toolProficiencies)}
        </p>
      )}
      {empty && (
        <p className="text-sm text-muted">Sin competencias registradas (se asignan al crear).</p>
      )}
    </SheetCard>
  );
}
