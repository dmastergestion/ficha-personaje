import { useEffect, useState } from "react";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";
import { plantillaPdfDisponible } from "@/pdf/pdfTemplate";

async function exportarPdf(character: Character, catalog: GameCatalog): Promise<string[]> {
  const { exportarFichaPdf } = await import("@/pdf/exportPdf");
  return exportarFichaPdf(character, catalog);
}

export function useCharacterSheetPdf(character: Character | null, catalog: GameCatalog) {
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [pdfDisponible, setPdfDisponible] = useState<boolean | null>(null);

  useEffect(() => {
    void plantillaPdfDisponible().then(setPdfDisponible);
  }, []);

  async function onExportPdf() {
    if (!character || exportandoPdf) return;
    if (pdfDisponible === false) {
      setErrorPdf("Plantilla PDF no encontrada. En local ejecuta: npm run prepare:pdf-template");
      return;
    }

    setExportandoPdf(true);
    setErrorPdf(null);
    try {
      const missing = await exportarPdf(character, catalog);
      if (missing.length > 0) {
        setErrorPdf(
          missing.length > 3
            ? `PDF generado. No se pudieron rellenar ${missing.length} campos del formulario (p. ej. ${missing.slice(0, 3).join(", ")}…). El archivo sí se descargó.`
            : `PDF generado. No se pudieron rellenar: ${missing.join(", ")}. El archivo sí se descargó.`,
        );
      }
    } catch (err) {
      console.error("No se pudo exportar el PDF", err);
      setErrorPdf(err instanceof Error ? err.message : "No se pudo exportar el PDF.");
    } finally {
      setExportandoPdf(false);
    }
  }

  const pdfTitle =
    pdfDisponible === false
      ? "Requiere plantilla PDF (npm run prepare:pdf-template)"
      : undefined;

  return { errorPdf, exportandoPdf, pdfDisponible, pdfTitle, onExportPdf };
}
