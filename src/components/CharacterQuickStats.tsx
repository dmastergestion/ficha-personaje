import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";

import { percepcionPasiva, iniciativa, velocidad } from "@/rules/character";
import { bonificadorIniciativaDotes } from "@/rules/feat-mechanics";
import { alcanceVisionOscura, etiquetaVisionOscura } from "@/rules/sensory";

import { desgloseClaseArmadura } from "@/rules/combat";
import { abreviaturaArmadura } from "@/rules/armor-text";

import { etiquetaDadosGolpe } from "@/rules/hit-dice";

import { descripcionDadosGolpe } from "@/rules/multiclass";

import { srdArmor } from "@/rules/srd";

import type { Character } from "@/schemas/character";

import { useCatalogStore } from "@/stores/catalog-store";

import { StatPill } from "@/components/sheet-ui";
import { InfoTrigger } from "@/components/InfoTrigger";
import { HeroicInspirationInfoPanel } from "@/components/HeroicInspirationInfoPanel";
import { INSPIRACION_HEROICA_TIP } from "@/rules/heroic-inspiration";

import { HitDiceSpendButtons } from "@/components/HitDiceSpendButtons";

import { useUiStore } from "@/stores/ui-store";



export function CharacterQuickStats({

  character,

  onChange,

}: {

  character: Character;

  onChange?: (next: Character) => void;

}) {

  const catalog = useCatalogStore((s) => s.catalog);

  const shield = srdArmor.find((item) => item.category === "shield");

  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;

  const caDesglose = desgloseClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
    armor
      ? {
          etiquetaArmadura: abreviaturaArmadura(
            armor,
            catalog.t("armor", armor.id, armor.nameEn),
          ),
        }
      : undefined,
  );

  const speciesSpeed = character.identity.speciesId

    ? catalog.obtenerEspecie(character.identity.speciesId)?.speed

    : undefined;

  const baseSpeed = speciesSpeed ?? 30;

  const speed = velocidad(character, baseSpeed);

  const ini = iniciativa(character);
  const iniBonusDote = bonificadorIniciativaDotes(character);

  const dexMod = modificadorAtributo(character.abilities.dex);

  const pb = bonificadorCompetencia(character.identity.level);

  const speciesTraits = character.identity.speciesId
    ? catalog.obtenerEspecie(character.identity.speciesId)?.traits
    : undefined;
  const darkvisionFt = alcanceVisionOscura(character.identity.speciesId, speciesTraits);

  const editable = !!onChange;

  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  return (

    <div className="sheet-quick-stats" aria-label="Estadísticas de combate (ficha oficial)">

      <StatPill

        label="Bonificador por competencia"

        value={`+${pb}`}

        sub="PB"

      />

      <StatPill
        label="Puntos de vida"
        labelPrefix={
          <span className="text-danger text-sm leading-none" aria-hidden="true">
            ♥
          </span>
        }
        value={

          <>

            {character.combat.hpCurrent}

            <span className="text-muted"> / {character.combat.hpMax}</span>

          </>

        }

        sub={character.combat.hpTemp > 0 ? `+${character.combat.hpTemp} temp` : undefined}
      />

      <StatPill
        label="Clase de armadura"
        value={caDesglose.total}
        sub={caDesglose.resumen}
      />

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
              placeholder={`Auto DES ${dexMod >= 0 ? `+${dexMod}` : dexMod}`}
              title="Si lo rellenas, sustituye al modificador de Destreza (p. ej. por dotes o bonificadores fijos). Vacío = usa DES."
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

        value={`${speed} ft`}

        trailing={

          editable ? (

            <label className="inline-flex items-center gap-1 text-xs">

              <span className="text-muted">Fija (pies)</span>

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

        label="Dados de golpe"

        value={etiquetaDadosGolpe(character)}

        sub={`descanso corto · ${descripcionDadosGolpe(character.identity.classes)}`}

        trailing={

          editable ? (

            <HitDiceSpendButtons

              character={character}

              onChange={onChange!}

              onRoll={(msg) => setUltimaTirada(null, msg)}

              compact

            />

          ) : undefined

        }

      />

      <StatPill
        label="Inspiración heroica"
        labelAddon={
          <InfoTrigger
            tip={INSPIRACION_HEROICA_TIP}
            title="Inspiración heroica"
            panel={<HeroicInspirationInfoPanel />}
            className="size-5 text-xs"
            tipPlacement="bottom"
          />
        }
        value={

          editable ? (

            <label className="inline-flex cursor-pointer items-center gap-2">

              <input

                type="checkbox"

                className="size-4 accent-gold"

                checked={character.combat.inspiration}

                onChange={(e) =>

                  onChange!({

                    ...character,

                    combat: { ...character.combat, inspiration: e.target.checked },

                  })

                }

              />

              <span className="text-sm font-normal">{character.combat.inspiration ? "Sí" : "No"}</span>

            </label>

          ) : character.combat.inspiration ? (

            "Sí"

          ) : (

            "No"

          )

        }

      />

    </div>

  );

}

