import { useRef, useState } from "react";
import { Button } from "@/components/layout";
import { procesarArchivoRetrato } from "@/lib/portrait-image";

export function CharacterPortraitField({
  portraitImage,
  onChange,
}: {
  portraitImage: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setCargando(true);
    setError(null);
    try {
      const dataUrl = await procesarArchivoRetrato(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la imagen.");
    } finally {
      setCargando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <span className="text-muted">Retrato del personaje</span>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-surface">
          {portraitImage ? (
            <img
              src={portraitImage}
              alt="Retrato del personaje"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted">Sin imagen</span>
          )}
        </div>
        <div className="flex min-w-[12rem] flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFileSelected(e.target.files?.[0])}
          />
          <Button
            type="button"
            className="w-fit"
            disabled={cargando}
            onClick={() => inputRef.current?.click()}
          >
            {cargando ? "Procesando…" : portraitImage ? "Cambiar imagen" : "Subir imagen"}
          </Button>
          {portraitImage && (
            <Button
              type="button"
              variant="ghost"
              className="w-fit"
              disabled={cargando}
              onClick={() => {
                setError(null);
                onChange(null);
              }}
            >
              Quitar imagen
            </Button>
          )}
          <p className="text-xs text-muted">JPG, PNG o WebP · máx. 8 MB · se guarda en la ficha.</p>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
