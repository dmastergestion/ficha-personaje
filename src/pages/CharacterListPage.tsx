import { useEffect, useState } from "react";
import { InstallBanner } from "@/components/InstallBanner";
import { Button, Layout, LinkButton } from "@/components/layout";
import {
  descargarJson,
  duplicarPersonaje,
  eliminarPersonaje,
  exportarBackup,
  listarPersonajes,
  nombreArchivoExport,
} from "@/db/repository";
import type { Character } from "@/schemas/character";
import { descripcionClases } from "@/rules/multiclass";

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

  async function onDuplicate(id: string) {
    await duplicarPersonaje(id);
    await recargar();
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar a ${name}?`)) return;
    await eliminarPersonaje(id);
    await recargar();
  }

  return (
    <Layout
      title="Mis personajes"
      actions={
        <LinkButton to="/new" variant="primary" className="px-3 py-2">
          Nuevo personaje
        </LinkButton>
      }
    >
      <InstallBanner />
      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-8 text-center">
          <p className="mb-4 text-muted">Aún no hay personajes guardados.</p>
          <LinkButton to="/new" variant="primary">
            Crear el primero
          </LinkButton>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((character) => (
              <li
                key={character.id}
                className="rounded-xl border border-white/10 bg-panel p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{character.identity.name}</h2>
                    <p className="text-sm text-muted">
                      {descripcionClases(character.identity.classes)} · Total{" "}
                      {character.identity.level}
                    </p>
                    <p className="text-sm">
                      PV {character.combat.hpCurrent}/{character.combat.hpMax}
                    </p>
                  </div>
                  <LinkButton to={`/character/${character.id}`} variant="primary" className="shrink-0 px-3 py-1.5 text-sm">
                    Abrir
                  </LinkButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      descargarJson(
                        nombreArchivoExport("ficha", character.identity.name),
                        exportarBackup(character),
                      )
                    }
                  >
                    Exportar
                  </Button>
                  <Button onClick={() => void onDuplicate(character.id)}>Duplicar</Button>
                  <Button
                    variant="ghost"
                    onClick={() => void onDelete(character.id, character.identity.name)}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
