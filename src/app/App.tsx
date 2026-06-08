import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CharacterListPage } from "@/pages/CharacterListPage";
import { CharacterNewPage } from "@/pages/CharacterNewPage";
import { CharacterSheetPage } from "@/pages/character-sheet/CharacterSheetPage";
import { SettingsPage } from "@/pages/SettingsPage";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<CharacterListPage />} />
        <Route path="/new" element={<CharacterNewPage />} />
        <Route path="/character/:id" element={<CharacterSheetPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
