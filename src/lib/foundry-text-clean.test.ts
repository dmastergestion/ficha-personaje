import { describe, expect, it } from "vitest";
import { htmlFoundryAPlano, limpiarTextoFoundry } from "@/lib/foundry-text-clean";

describe("limpiarTextoFoundry", () => {
  it("extrae etiqueta de @UUID con cierre", () => {
    const text = limpiarTextoFoundry(
      "Lista de @UUID[Compendium.dnd5e.content24.JournalEntry.phbSpells0000000.JournalEntryPage.SkHptN2PTzFGDaEj]{Lista de conjuros de clérigo}.",
    );
    expect(text).toBe("Lista de Lista de conjuros de clérigo.");
    expect(text).not.toContain("@UUID");
  });

  it("limpia HTML de dote en español", () => {
    const text = htmlFoundryAPlano(
      "<p><strong>Dos trucos.</strong> Aprendes trucos de @UUID[Compendium.x]{Lista de conjuros de clérigo}.</p>",
    );
    expect(text).toContain("Dos trucos");
    expect(text).toContain("Lista de conjuros de clérigo");
    expect(text).not.toContain("@UUID");
  });
});
