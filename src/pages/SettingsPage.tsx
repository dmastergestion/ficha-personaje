import { useRef, useState } from "react";
import { Button, Layout } from "@/components/layout";
import { guardarPersonaje, importarPersonaje } from "@/db/repository";

export function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function onImport(file: File) {
    try {
      const text = await file.text();
      const character = importarPersonaje(text);
      await guardarPersonaje(character);
      setMensaje(`Importado: ${character.identity.name}`);
    } catch {
      setMensaje("Archivo JSON inválido o incompatible.");
    }
  }

  return (
    <Layout title="Ajustes">
      <div className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <h2 className="mb-2 text-lg font-semibold">Importar backup</h2>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImport(file);
            }}
          />
          <Button onClick={() => inputRef.current?.click()}>Elegir archivo JSON</Button>
          {mensaje && <p className="mt-2 text-sm text-muted">{mensaje}</p>}
        </section>

        <section className="rounded-xl border border-white/10 bg-panel p-4 text-sm text-muted">
          <h2 className="mb-2 text-lg font-semibold text-white">Acerca de</h2>
          <p>Versión app: 0.3.0 · Schema personaje: v3</p>
          <h2 className="mb-2 mt-4 text-lg font-semibold text-white">Licencias</h2>
          <p>
            Contenido de reglas derivado del SRD 5.2.1 © Wizards of the Coast / D&D Beyond —
            Creative Commons Attribution 4.0.
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
