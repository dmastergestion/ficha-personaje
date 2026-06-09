import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { UpdateBanner } from "@/components/UpdateBanner";
import { CatalogProvider } from "@/components/CatalogProvider";

const CharacterListPage = lazy(() =>
  import("@/pages/CharacterListPage").then((m) => ({ default: m.CharacterListPage })),
);
const CharacterNewPage = lazy(() =>
  import("@/pages/CharacterNewPage").then((m) => ({ default: m.CharacterNewPage })),
);
const CharacterSheetPage = lazy(() =>
  import("@/pages/character-sheet/CharacterSheetPage").then((m) => ({
    default: m.CharacterSheetPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

function CargandoPagina() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4 text-muted">
      Cargando…
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <CatalogProvider>
        <UpdateBanner />
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route path="/" element={<CharacterListPage />} />
            <Route path="/new" element={<CharacterNewPage />} />
            <Route path="/character/:id" element={<CharacterSheetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </CatalogProvider>
    </BrowserRouter>
  );
}
