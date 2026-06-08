import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Layout } from "@/components/layout";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import type { Character } from "@/schemas/character";
import { bonificadorCompetencia, modificadorAtributo } from "@/rules/ability";
import { calcularClaseArmadura } from "@/rules/combat";
import { tirarD20 } from "@/rules/dice";
import { srdArmor, srdClasses, t } from "@/rules/srd";
import { useUiStore } from "@/stores/ui-store";
import { ABILITY_KEYS } from "@/lib/constants";

const ABILITY_LABELS: Record<(typeof ABILITY_KEYS)[number], string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

const ARMOR_OPTIONS = srdArmor.filter((item) => item.category !== "shield");

export function CharacterSheetPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const ultimaTirada = useUiStore((state) => state.ultimaTirada);
  const setUltimaTirada = useUiStore((state) => state.setUltimaTirada);
  const shield = srdArmor.find((item) => item.category === "shield");

  useEffect(() => {
    if (!id) return;
    void obtenerPersonaje(id).then((value) => {
      if (value) setCharacter(value);
    });
  }, [id]);

  if (!character) {
    return (
      <Layout title="Ficha">
        <p className="text-muted">Cargando ficha…</p>
      </Layout>
    );
  }

  const pb = bonificadorCompetencia(character.identity.level);
  const armor = srdArmor.find((item) => item.id === character.equipment.armorId) ?? null;
  const ca = calcularClaseArmadura(
    character.abilities.dex,
    armor,
    character.equipment.shieldEquipped,
    shield,
    character.combat.armorClassOverride,
  );

  async function persist(next: Character) {
    setCharacter(next);
    await guardarPersonaje(next);
  }

  function ajustarPv(delta: number) {
    if (!character) return;
    const hpCurrent = Math.min(
      character.combat.hpMax + character.combat.hpTemp,
      Math.max(0, character.combat.hpCurrent + delta),
    );
    void persist({
      ...character,
      combat: { ...character.combat, hpCurrent },
    });
  }

  return (
    <Layout
      title={character.identity.name}
      actions={
        <Link to="/">
          <Button>Volver</Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="text-lg font-semibold">Combate</h2>
          <p className="text-sm text-muted">
            {t("classes", character.identity.classId, character.identity.classId)} · Nivel{" "}
            {character.identity.level} · PB +{pb}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold">
              PV {character.combat.hpCurrent}/{character.combat.hpMax}
            </span>
            <Button variant="critical" onClick={() => ajustarPv(-1)}>
              −1
            </Button>
            <Button variant="critical" onClick={() => ajustarPv(-5)}>
              −5
            </Button>
            <Button variant="critical" onClick={() => ajustarPv(1)}>
              +1
            </Button>
            <Button variant="critical" onClick={() => ajustarPv(5)}>
              +5
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Armadura</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                value={character.equipment.armorId ?? ""}
                onChange={(event) =>
                  void persist({
                    ...character,
                    equipment: {
                      ...character.equipment,
                      armorId: event.target.value || null,
                    },
                  })
                }
              >
                <option value="">Sin armadura (10 + DES)</option>
                {ARMOR_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {t("armor", item.id, item.nameEn)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={character.equipment.shieldEquipped}
                onChange={(event) =>
                  void persist({
                    ...character,
                    equipment: {
                      ...character.equipment,
                      shieldEquipped: event.target.checked,
                    },
                  })
                }
              />
              Escudo (+2)
            </label>
          </div>
          <p>
            CA {ca} · Temp {character.combat.hpTemp}
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="text-lg font-semibold">Atributos</h2>
          {ABILITY_KEYS.map((key) => {
            const score = character.abilities[key];
            const mod = modificadorAtributo(score);
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <span>
                  {ABILITY_LABELS[key]} {score} ({mod >= 0 ? `+${mod}` : mod})
                </span>
                <Button
                  variant="critical"
                  onClick={() => setUltimaTirada(tirarD20(mod, "normal"))}
                >
                  d20
                </Button>
              </div>
            );
          })}
          {ultimaTirada && (
            <p className="rounded-lg bg-surface px-3 py-2 text-sm">
              Tirada: {ultimaTirada.used} + {ultimaTirada.modifier} ={" "}
              <strong>{ultimaTirada.total}</strong>
              {ultimaTirada.isCritical && " · ¡Crítico!"}
              {ultimaTirada.isFumble && " · ¡Pifia!"}
            </p>
          )}
        </section>
      </div>

      <p className="mt-6 text-sm text-muted">
        {srdClasses.length} clases SRD · {srdArmor.length} piezas de armadura · PWA lista para
        instalar.
      </p>
    </Layout>
  );
}
