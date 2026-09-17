import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InstallBanner } from "@/components/InstallBanner";
import { Button, Layout, LinkButton, buttonClassName } from "@/components/layout";
import {
  descargarJson,
  duplicarPersonaje,
  eliminarPersonaje,
  exportarBackup,
  exportarTracker,
  listarPersonajes,
  nombreArchivoExport,
} from "@/db/repository";
import type { Character } from "@/schemas/character";
import { claseArmaduraPersonaje } from "@/rules/combat";
import { etiquetaListaPersonaje } from "@/rules/multiclass";

export function CharacterListPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [invalidos, setInvalidos] = useState(0);
  const [loading, setLoading] = useState(true);

  async function recargar() {
    setLoading(true);
    const listado = await listarPersonajes();
    setCharacters(listado.characters);
    setInvalidos(listado.invalidos);
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
      {invalidos > 0 && (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {invalidos} ficha{invalidos === 1 ? "" : "s"} no se pudieron leer (JSON inválido).
        </p>
      )}
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
              className="relative rounded-xl border border-white/10 bg-panel transition hover:border-accent/30"
            >
              <Link
                to={`/character/${character.id}`}
                className="block p-4 pr-12"
                aria-label={`Abrir ${character.identity.name}`}
              >
                <h2 className="text-lg font-semibold text-cream">{character.identity.name}</h2>
                <p className="text-sm text-muted">
                  {etiquetaListaPersonaje(character.identity.classes, character.identity.level)}
                </p>
                <p className="text-sm">
                  PV {character.combat.hpCurrent}/{character.combat.hpMax}
                </p>
              </Link>
              <details className="sheet-overflow-menu absolute right-3 top-3">
                <summary
                  className={buttonClassName("ghost", "cursor-pointer px-2 py-1 text-sm")}
                  aria-label={`Acciones de ${character.identity.name}`}
                >
                  ⋯
                </summary>
                <div className="absolute right-0 z-20 mt-1 flex min-w-[9rem] flex-col gap-1 rounded-xl border border-white/10 bg-elevated p-1.5 shadow-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm"
                    onClick={() =>
                      descargarJson(
                        nombreArchivoExport("ficha", character.identity.name),
                        exportarBackup(character),
                      )
                    }
                  >
                    Exportar
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm"
                    onClick={() =>
                      descargarJson(
                        nombreArchivoExport("tracker", character.identity.name),
                        exportarTracker(character, claseArmaduraPersonaje(character)),
                      )
                    }
                  >
                    Tracker
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm"
                    onClick={() => void onDuplicate(character.id)}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm text-danger"
                    onClick={() => void onDelete(character.id, character.identity.name)}
                  >
                    Eliminar
                  </Button>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
