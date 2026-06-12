import { describe, expect, it } from "vitest";
import {
  etiquetaCompetenciaArma,
  etiquetaListaCompetenciasHerramientas,
  proficienciasIniciales,
} from "@/rules/proficiencies";

describe("etiquetas de competencia", () => {
  it("traduce armas al español", () => {
    expect(etiquetaCompetenciaArma("simple")).toBe("Simples");
    expect(etiquetaCompetenciaArma("martial")).toBe("Marciales");
    expect(etiquetaCompetenciaArma("martial (light)")).toBe("Marciales (ligeras)");
  });

  it("traduce herramientas al español", () => {
    expect(etiquetaListaCompetenciasHerramientas(["calligrapher's supplies"])).toBe(
      "Suministros de calígrafo",
    );
  });
});

describe("proficienciasIniciales", () => {
  it("asigna salvaciones de clase", () => {
    const { savingThrows } = proficienciasIniciales("fighter");
    expect(savingThrows).toEqual(["str", "con"]);
  });

  it("añade pericias de trasfondo", () => {
    const { skills } = proficienciasIniciales("wizard", ["arcana", "history"]);
    expect(skills).toEqual(["arcana", "history"]);
  });
});
