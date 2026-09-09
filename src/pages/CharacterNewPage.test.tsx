// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CharacterNewPage } from "@/pages/CharacterNewPage";
import { DRAFT_KEY } from "@/pages/character-new/draft";

function renderAsistente() {
  return render(
    <MemoryRouter initialEntries={["/new"]}>
      <Routes>
        <Route path="/new" element={<CharacterNewPage />} />
        <Route path="/" element={<p>Lista</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CharacterNewPage", () => {
  beforeEach(() => {
    sessionStorage.removeItem(DRAFT_KEY);
  });

  afterEach(() => {
    cleanup();
    sessionStorage.removeItem(DRAFT_KEY);
  });

  it("parte en identidad y avanza a origen con un nombre", async () => {
    renderAsistente();
    expect(await screen.findByText("¿Cómo se llama tu personaje?")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: /nombre del personaje/i }), {
      target: { value: "Aragorn" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByRole("heading", { name: "Origen" })).toBeInTheDocument();
  });
});
