import { useRef, useState } from "react";
import { Button, Layout } from "@/components/layout";
import { SCHEMA_VERSION } from "@/lib/constants";
import { guardarPersonaje, importarPersonaje } from "@/db/repository";
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
      const character = importarPersonaje(text);
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
      setMensaje(
        `Pack ${loaded.source} cargado: ${loaded.counts.backgrounds} trasfondos, ${loaded.counts.species} especies, ${loaded.counts.subclasses} subclases.`,
      );
    } catch {
      setMensaje("Pack de contenido inválido. Usa xphb-pack.json generado con npm run build:content-pack.");
    }
  }

  async function onRemovePack() {
    await removePack();
    setMensaje(
      "Pack importado eliminado. Al recargar la página se restaurará el PHB incluido en la app.",
    );
  }

  return (
    <Layout title="Ajustes">
      <div className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">Contenido PHB 2024</h2>
          <p className="mb-3 text-sm text-muted">
            La app incluye el PHB 2024 completo en español al instalarse (sin descargas extra). Solo
            importa un pack manualmente si quieres sustituir el incluido.
          </p>
          {pack ? (
            <div className="mb-3 rounded-lg bg-surface px-3 py-2 text-sm">
              <p>
                Activo: <strong>{pack.source}</strong> · {pack.counts.backgrounds} trasfondos ·{" "}
                {pack.counts.species} especies · {pack.counts.subclasses} subclases ·{" "}
                {pack.counts.spells} conjuros (textos en español)
              </p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-accent">
              Cargando catálogo… Si persiste, recarga la página.
            </p>
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
            <Button onClick={() => packRef.current?.click()}>Importar pack PHB</Button>
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
            El pack PHB es uso local si posees el libro; no se redistribuye con la app pública.
          </p>
          <p className="mt-2">
            <a
              className="text-gold underline"
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
