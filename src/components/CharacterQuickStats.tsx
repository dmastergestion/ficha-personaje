import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { iniciativa, percepcionPasiva, velocidad } from "@/rules/character";
import { bonificadorIniciativaDotes } from "@/rules/feat-mechanics";
import { desgloseCaPersonaje } from "@/rules/combat";
import { abreviaturaArmadura } from "@/rules/armor-text";
import { srdArmor } from "@/rules/srd";
import { alcanceVisionOscura, etiquetaVisionOscura } from "@/rules/sensory";
import { atributosEfectivos } from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import { HeroicInspirationInfoPanel } from "@/components/HeroicInspirationInfoPanel";
import { InfoTrigger } from "@/components/InfoTrigger";
import { StatPill } from "@/components/sheet-ui";
import { INSPIRACION_HEROICA_TIP } from "@/rules/heroic-inspiration";

export function CharacterQuickStats({
  character,
  onChange,
}: {
  character: Character;
  onChange?: (next: Character) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const caDesglose = desgloseCaPersonaje(character, {
    etiquetaArmadura: armor
      ? abreviaturaArmadura(armor, catalog.t("armor", armor.id, armor.nameEn))
      : undefined,
  });
  const speciesSpeed = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.speed
    : undefined;
  const baseSpeed = speciesSpeed ?? 30;
  const speed = velocidad(character, baseSpeed);
  const ini = iniciativa(character);
  const iniBonusDote = bonificadorIniciativaDotes(character);
  const dexMod = modificadorAtributo(atributosEfectivos(character).dex);
  const pb = bonificadorCompetencia(character.identity.level);
  const editable = !!onChange;
  const speciesTraits = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.traits
    : undefined;
  const darkvisionFt = alcanceVisionOscura(character.identity.speciesId, speciesTraits);

  return (
    <div className="sheet-quick-stats" aria-label="Estadísticas de combate">
      <StatPill
        label="Puntos de vida"
        labelPrefix={
          <span className="text-danger text-sm leading-none" aria-hidden="true">
            ♥
          </span>
        }
        value={`${character.combat.hpCurrent} / ${character.combat.hpMax}`}
        sub={character.combat.hpTemp > 0 ? `+${character.combat.hpTemp} temp` : undefined}
      />
      <StatPill label="Clase de armadura" value={caDesglose.total} sub={caDesglose.resumen} />
      <StatPill
        label="Iniciativa"
        value={ini >= 0 ? `+${ini}` : ini}
        sub={
          iniBonusDote > 0 && character.combat.initiativeOverride == null
            ? `DES ${dexMod >= 0 ? `+${dexMod}` : dexMod} + PB (Alerta)`
            : undefined
        }
        trailing={
          editable ? (
            <input
              type="number"
              className="sheet-stat-pill-input"
              placeholder={`Auto (DES ${dexMod >= 0 ? `+${dexMod}` : dexMod})`}
              title="Si lo rellenas, sustituye al modificador de Destreza. Vacío = usa DES."
              value={character.combat.initiativeOverride ?? ""}
              onChange={(e) =>
                onChange!({
                  ...character,
                  combat: {
                    ...character.combat,
                    initiativeOverride: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
            />
          ) : undefined
        }
      />
      <StatPill
        label="Velocidad"
        value={`${speed} pies`}
        trailing={
          editable ? (
            <label className="inline-flex items-center gap-1 text-xs">
              <span className="text-muted">Forzar</span>
              <input
                type="number"
                min={0}
                className="sheet-stat-pill-input"
                placeholder={String(baseSpeed)}
                title="Sustituye la velocidad de especie si necesitas un valor concreto."
                value={character.combat.speedOverride ?? ""}
                onChange={(e) =>
                  onChange!({
                    ...character,
                    combat: {
                      ...character.combat,
                      speedOverride: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
              />
            </label>
          ) : undefined
        }
      />
      <StatPill
        label="Percepción pasiva"
        value={percepcionPasiva(character)}
        sub={darkvisionFt ? etiquetaVisionOscura(darkvisionFt) : undefined}
      />
      <StatPill
        label="Bonificador por competencia"
        value={`+${pb}`}
        trailing={
          <span className="inline-flex items-center gap-1.5">
            {editable ? (
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={character.combat.inspiration}
                  onChange={(e) =>
                    onChange!({
                      ...character,
                      combat: { ...character.combat, inspiration: e.target.checked },
                    })
                  }
                />
                Inspiración
              </label>
            ) : character.combat.inspiration ? (
              <span className="text-xs text-cream">Inspiración</span>
            ) : (
              <span className="text-xs text-muted">Sin inspiración</span>
            )}
            <InfoTrigger
              tip={INSPIRACION_HEROICA_TIP}
              title="Inspiración heroica"
              panel={<HeroicInspirationInfoPanel />}
              tipPlacement="bottom"
            />
          </span>
        }
      />
    </div>
  );
}
