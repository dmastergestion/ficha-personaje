// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  await screen.findByRole("heading", { name: "Daño y curación" }, { timeout: 8000 });
}

function pvEnHud(texto: string) {
  return within(screen.getByLabelText("Estadísticas de combate")).getByText(texto);
}

describe("CharacterSheetPage", () => {
  beforeEach(async () => {
    const { db } = await import("@/db");
    await db.characters.clear();
    useUiStore.setState({ sheetTabsById: {}, tipoDanio: "" });
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
    expect(
      within(screen.getByLabelText("Condiciones")).getByText("Ninguna"),
    ).toBeInTheDocument();

    await irACombate();
    expect(pvEnHud("10 / 10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restar PV (daño)" }));
    expect(await waitFor(() => pvEnHud("5 / 10"))).toBeInTheDocument();
    expect(await screen.findByText("Guardado")).toBeInTheDocument();

    cleanup();
    useUiStore.setState({ sheetTabsById: {}, tipoDanio: "" });

    renderFicha(character.id);
    expect(await screen.findByDisplayValue("Testigo")).toBeInTheDocument();
    await irACombate();
    expect(await waitFor(() => pvEnHud("5 / 10"))).toBeInTheDocument();

    const recargado = await obtenerPersonaje(character.id);
    expect(recargado?.combat.hpCurrent).toBe(5);
  });

  it("muestra y aplica la resistencia racial al daño", async () => {
    const character = crearPersonajeVacio({
      name: "Enano",
      playerName: "Jugador",
      classId: "fighter",
      speciesId: "dwarf",
    });
    character.combat.hpMax = 20;
    character.combat.hpCurrent = 20;
    await guardarPersonaje(character);

    renderFicha(character.id);
    await irACombate();
    expect(screen.getByText(/De especie: veneno/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cantidad de PV a sumar o restar"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getAllByLabelText("Tipo de daño (opcional)")[0]!, {
      target: { value: "veneno" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restar PV (daño)" }));
    expect(await waitFor(() => pvEnHud("15 / 20"))).toBeInTheDocument();
  });

  it("muestra el selector de añadir clase", async () => {
    const character = crearPersonajeVacio({
      name: "Testigo",
      playerName: "Jugador",
      classId: "fighter",
    });
    character.abilities = { str: 15, dex: 14, con: 14, int: 13, wis: 10, cha: 8 };
    await guardarPersonaje(character);

    renderFicha(character.id);
    fireEvent.click(await screen.findByRole("button", { name: "Identidad del personaje" }));
    expect(await screen.findByRole("tab", { name: "Catálogo" })).toBeInTheDocument();
    const select = await screen.findByLabelText("Añadir clase (multiclase)");
    expect(select).toBeEnabled();
    expect(within(select).getByRole("option", { name: "Mago" })).toBeEnabled();
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
