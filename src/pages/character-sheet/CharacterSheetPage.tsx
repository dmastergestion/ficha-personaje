import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useCharacterSheetPersistence } from "@/hooks/useCharacterSheetPersistence";
import { useCharacterSheetPdf } from "@/hooks/useCharacterSheetPdf";
import { CharacterSheetLoaded } from "@/pages/character-sheet/CharacterSheetLoaded";
import type { SheetTab } from "@/pages/character-sheet/types";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

export function CharacterSheetPage() {
  const { id } = useParams();
  const { character, estado, errorGuardado, saveStatus, persist } =
    useCharacterSheetPersistence(id);
  const catalog = useCatalogStore((s) => s.catalog);
  const pdf = useCharacterSheetPdf(character, catalog);

  const tab = useUiStore((s) => (id ? s.sheetTabsById[id] : undefined) ?? "combate");
  const setSheetTab = useUiStore((s) => s.setSheetTab);
  const setTab = (next: SheetTab) => {
    if (id) setSheetTab(id, next);
  };

  if (estado !== "listo" || !character) {
    if (estado === "no-encontrado") {
      return (
        <Layout title="Ficha">
          <div className="space-y-3">
            <p className="text-muted">No se encontró esta ficha.</p>
            <Link to="/" className="text-accent underline">
              Volver a la lista de personajes
            </Link>
          </div>
        </Layout>
      );
    }

    if (estado === "error") {
      return (
        <Layout title="Ficha">
          <div className="space-y-3">
            <p className="text-red-400">Hubo un error al cargar la ficha.</p>
            <Link to="/" className="text-accent underline">
              Volver a la lista de personajes
            </Link>
          </div>
        </Layout>
      );
    }

    return (
      <Layout title="Ficha">
        <p className="text-muted">Cargando ficha…</p>
      </Layout>
    );
  }

  return (
    <CharacterSheetLoaded
      character={character}
      catalog={catalog}
      tab={tab}
      setTab={setTab}
      persist={persist}
      saveStatus={saveStatus}
      errorGuardado={errorGuardado}
      errorPdf={pdf.errorPdf}
      pdfDisponible={pdf.pdfDisponible}
      pdfTitle={pdf.pdfTitle}
      exportandoPdf={pdf.exportandoPdf}
      onExportPdf={() => void pdf.onExportPdf()}
    />
  );
}
