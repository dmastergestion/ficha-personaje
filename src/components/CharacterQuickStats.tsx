import { bonificadorCompetencia } from "@/rules/ability";
import { iniciativa, percepcionPasiva } from "@/rules/character";
import { calcularClaseArmadura } from "@/rules/combat";
import { etiquetaDadosGolpe } from "@/rules/hit-dice";
import { descripcionDadosGolpe } from "@/rules/multiclass";
import { srdArmor } from "@/rules/srd";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import { StatPill } from "@/components/sheet-ui";

export function CharacterQuickStats({ character }: { character: Character }) {
  const catalog = useCatalogStore((s) => s.catalog);
  const shield = srdArmor.find((item) => item.category === "shield");
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );
  const speciesSpeed = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.speed
    : undefined;
  const speed = character.combat.speedOverride ?? speciesSpeed ?? 30;
  const ini = iniciativa(character);
  const pb = bonificadorCompetencia(character.identity.level);

  return (
    <div className="sheet-quick-stats" aria-label="Estadísticas rápidas">
      <StatPill
        label="Puntos de vida"
        value={
          <>
            {character.combat.hpCurrent}
            <span className="text-muted"> / {character.combat.hpMax}</span>
          </>
        }
        sub={character.combat.hpTemp > 0 ? `+${character.combat.hpTemp} temp` : undefined}
        accent
      />
      <StatPill label="Clase de armadura" value={ca} />
      <StatPill label="Iniciativa" value={ini >= 0 ? `+${ini}` : ini} />
      <StatPill label="Velocidad" value={`${speed} ft`} />
      <StatPill label="Competencia" value={`+${pb}`} sub={`Pasiva ${percepcionPasiva(character)}`} />
      <StatPill
        label="Dados de golpe"
        value={etiquetaDadosGolpe(character)}
        sub={`disponibles · ${descripcionDadosGolpe(character.identity.classes)}`}
      />
    </div>
  );
}
