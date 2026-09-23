import { describe, expect, it } from "vitest";
import { pasosAsistente } from "@/pages/character-new/draft";

describe("pasosAsistente", () => {
  it("sigue clase → origen → atributos y deja identidad al final", () => {
    expect(pasosAsistente("fighter", 1).map((p) => p.id)).toEqual([
      "clase",
      "origen",
      "atributos",
      "identidad",
      "resumen",
    ]);
    expect(pasosAsistente("cleric", 1).map((p) => p.id)).toEqual([
      "clase",
      "origen",
      "atributos",
      "conjuros",
      "identidad",
      "resumen",
    ]);
    expect(pasosAsistente(null, 1).map((p) => p.id)).toEqual([
      "clase",
      "origen",
      "atributos",
      "identidad",
      "resumen",
    ]);
  });
});
