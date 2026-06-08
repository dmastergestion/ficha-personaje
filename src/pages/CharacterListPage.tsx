import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InstallBanner } from "@/components/InstallBanner";
import { Button, Layout } from "@/components/layout";
import {
  descargarJson,
  eliminarPersonaje,
  exportarBackup,
  exportarTracker,
  listarPersonajes,
} from "@/db/repository";
import type { Character } from "@/schemas/character";
import { calcularClaseArmadura } from "@/rules/combat";
import { srdArmor, t } from "@/rules/srd";

export function CharacterListPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  async function recargar() {
    setLoading(true);
    setCharacters(await listarPersonajes());
    setLoading(false);
  }

  useEffect(() => {
    void recargar();
  }, []);

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar a ${name}?`)) return;
    await eliminarPersonaje(id);
    await recargar();
  }

  return (
    <Layout
      title="Mis personajes"
      actions={
        <Link to="/new">
          <Button variant="critical">Nuevo personaje</Button>
        </Link>
      }
    >
      <InstallBanner />
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-8 text-center">
          <p className="mb-4 text-muted">Aún no hay personajes guardados.</p>
          <Link to="/new">
            <Button variant="critical">Crear el primero</Button>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {characters.map((character) => {
            const ca = calcularClaseArmadura(
              character.abilities.dex,
              character.equipment.armorId
                ? srdArmor.find((a) => a.id === character.equipment.armorId)
                : null,
              character.equipment.shieldEquipped,
              srdArmor.find((a) => a.category === "shield"),
              character.combat.armorClassOverride,
            );

            return (
              <li
                key={character.id}
                className="rounded-xl border border-white/10 bg-panel p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{character.identity.name}</h2>
                    <p className="text-sm text-muted">
                      {t("classes", character.identity.classId, character.identity.classId)} · Nivel{" "}
                      {character.identity.level}
                    </p>
                    <p className="text-sm">
                      PV {character.combat.hpCurrent}/{character.combat.hpMax} · CA {ca}
                    </p>
                  </div>
                  <Link to={`/character/${character.id}`}>
                    <Button variant="critical">Abrir</Button>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      descargarJson(
                        `ficha-${character.identity.name}.json`,
                        exportarBackup(character),
                      )
                    }
                  >
                    Exportar
                  </Button>
                  <Button
                    onClick={() =>
                      descargarJson(
                        `tracker-${character.identity.name}.json`,
                        exportarTracker(character, ca),
                      )
                    }
                  >
                    Tracker
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void onDelete(character.id, character.identity.name)}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}
