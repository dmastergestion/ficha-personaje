// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CharacterSheetPage } from "@/pages/character-sheet/CharacterSheetPage";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import { crearPersonajeVacio } from "@/schemas/character";
import { useUiStore } from "@/stores/ui-store";

vi.mock("@/pdf/pdfTemplate", () => ({
  plantillaPdfDisponible: vi.fn().mockResolvedValue(false),
  reiniciarCachePlantillaPdf: vi.fn(),
}));

function renderFicha(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/character/${id}`]}>
      <Routes>
        <Route path="/character/:id" element={<CharacterSheetPage />} />
        <Route path="/" element={<p>Lista</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function irACombate() {
  fireEvent.click(await screen.findByRole("tab", { name: "Combate" }));
  await screen.findByRole("heading", { name: "Ajustar PV" }, { timeout: 8000 });
}

describe("CharacterSheetPage", () => {
  beforeEach(async () => {
    const { db } = await import("@/db");
    await db.characters.clear();
    useUiStore.setState({ sheetTabsById: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it("muestra aviso si la ficha no existe", async () => {
    renderFicha("id-inexistente");
    expect(await screen.findByText("No se encontró esta ficha.")).toBeInTheDocument();
  });

  it("abre la ficha, aplica daño, guarda y recarga los PV", async () => {
    const character = crearPersonajeVacio({
      name: "Testigo",
      playerName: "Jugador",
      classId: "fighter",
    });
    character.combat.hpMax = 10;
    character.combat.hpCurrent = 10;
    await guardarPersonaje(character);

    renderFicha(character.id);
    expect(await screen.findByDisplayValue("Testigo")).toBeInTheDocument();

    await irACombate();
    expect(screen.getByText(/Actual: 10\/10/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restar PV (daño)" }));
    expect(await screen.findByText(/Actual: 5\/10/)).toBeInTheDocument();
    expect(await screen.findByText("Guardado")).toBeInTheDocument();

    cleanup();
    useUiStore.setState({ sheetTabsById: {} });

    renderFicha(character.id);
    expect(await screen.findByDisplayValue("Testigo")).toBeInTheDocument();
    await irACombate();
    expect(await screen.findByText(/Actual: 5\/10/)).toBeInTheDocument();

    const recargado = await obtenerPersonaje(character.id);
    expect(recargado?.combat.hpCurrent).toBe(5);
  });

  it("vuelca el daño pendiente al desmontar la ficha", async () => {
    const character = crearPersonajeVacio({
      name: "Flush",
      playerName: "J",
      classId: "fighter",
    });
    character.combat.hpMax = 10;
    character.combat.hpCurrent = 10;
    await guardarPersonaje(character);

    renderFicha(character.id);
    await irACombate();
    fireEvent.click(screen.getByRole("button", { name: "Restar PV (daño)" }));
    cleanup();

    await waitFor(async () => {
      const saved = await obtenerPersonaje(character.id);
      expect(saved?.combat.hpCurrent).toBe(5);
    });
  });
});
