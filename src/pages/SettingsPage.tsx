import { useRef, useState } from "react";
import { Button, Layout } from "@/components/layout";
import { SCHEMA_VERSION } from "@/lib/constants";
import { guardarPersonaje, importarPersonaje, obtenerPersonaje } from "@/db/repository";
import { resumenPackNuevo } from "@/rules/catalog";
import { useCatalogStore } from "@/stores/catalog-store";

export function SettingsPage() {
  const backupRef = useRef<HTMLInputElement>(null);
  const packRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const pack = useCatalogStore((s) => s.pack);
  const importPack = useCatalogStore((s) => s.importPack);
  const removePack = useCatalogStore((s) => s.removePack);

  async function onImportBackup(file: File) {
    try {
      const text = await file.text();
      let character = importarPersonaje(text);
      const existing = await obtenerPersonaje(character.id);
      if (existing) {
        const overwrite = window.confirm(
          `Ya existe un personaje con el mismo id (${existing.identity.name}). Aceptar sobrescribe; Cancelar genera un id nuevo.`,
        );
        if (!overwrite) {
          character = {
            ...character,
            id: crypto.randomUUID(),
            identity: {
              ...character.identity,
              name: `${character.identity.name} (importado)`,
            },
          };
        }
      }
      await guardarPersonaje(character);
      setMensaje(`Personaje importado: ${character.identity.name}`);
    } catch {
      setMensaje("Archivo JSON inválido o incompatible.");
    }
  }

  async function onImportPack(file: File) {
    try {
      const text = await file.text();
      const loaded = await importPack(text);
      const nuevo = resumenPackNuevo(loaded);
      const extras =
        nuevo.spells +
        nuevo.subclasses +
        nuevo.species +
        nuevo.backgrounds +
        nuevo.classes +
        nuevo.weapons +
        nuevo.armor;
      setMensaje(
        extras > 0
          ? `Pack ${loaded.source}: +${nuevo.backgrounds} trasfondos, +${nuevo.species} especies, +${nuevo.subclasses} subclases, +${nuevo.spells} conjuros (el PHB ya incluido no se duplica).`
          : `Pack ${loaded.source} importado. No había entradas nuevas: el PHB ya está en la app.`,
      );
    } catch {
      setMensaje("Pack de contenido inválido. Usa un JSON de catálogo compatible.");
    }
  }

  async function onRemovePack() {
    await removePack();
    setMensaje(
      "Pack importado eliminado. Sigue activo el catálogo del PHB incluido en la app.",
    );
  }

  return (
    <Layout title="Ajustes">
      <div className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">Contenido extra</h2>
          <p className="mb-3 text-sm text-muted">
            El PHB 2024 ya está en la ficha. Importa un pack para añadir otro libro o contenido
            propio; las entradas que coincidan con el PHB se ignoran.
          </p>
          {pack ? (
            <div className="mb-3 rounded-lg bg-surface px-3 py-2 text-sm">
              <p>
                Pack extra: <strong>{pack.source}</strong> · {pack.counts.backgrounds} trasfondos ·{" "}
                {pack.counts.species} especies · {pack.counts.subclasses} subclases ·{" "}
                {pack.counts.spells} conjuros en el archivo (solo se añaden las que no estén ya)
              </p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted">Catálogo del PHB 2024 incluido. Sin pack extra.</p>
          )}
          <input
            ref={packRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImportPack(file);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => packRef.current?.click()}>Importar pack extra</Button>
            {pack && (
              <Button variant="ghost" onClick={() => void onRemovePack()}>
                Quitar pack
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">Importar backup de personaje</h2>
          <input
            ref={backupRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImportBackup(file);
              event.target.value = "";
            }}
          />
          <Button onClick={() => backupRef.current?.click()}>Elegir archivo JSON</Button>
        </section>

        {mensaje && <p className="text-sm text-muted">{mensaje}</p>}

        <section className="rounded-xl border border-white/10 bg-panel p-4 text-sm text-muted">
          <h2 className="mb-2 text-lg font-semibold text-white">Acerca de</h2>
          <p>
            Versión app: {__APP_VERSION__} · Schema personaje: v{SCHEMA_VERSION}
          </p>
          <h2 className="mb-2 mt-4 text-lg font-semibold text-white">Licencias</h2>
          <p>
            Contenido de reglas derivado del SRD 5.2.1 © Wizards of the Coast / D&D Beyond —
            Creative Commons Attribution 4.0.
          </p>
          <p className="mt-2">
            PHB 2024: uso personal si posees el libro. El SRD 5.2.1 sigue siendo la base pública CC
            BY 4.0.
          </p>
          <p className="mt-2">
            <a
              className="text-accent underline"
              href="https://www.dndbeyond.com/srd"
              target="_blank"
              rel="noreferrer"
            >
              dndbeyond.com/srd
            </a>
          </p>
        </section>
      </div>
    </Layout>
  );
}
