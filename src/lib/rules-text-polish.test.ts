import { describe, expect, it } from "vitest";
import { piesAMetrosTexto, pulirTextoReglasEs } from "@/lib/rules-text-polish";

describe("piesAMetrosTexto", () => {
  it("convierte múltiplos de 5 pies", () => {
    expect(piesAMetrosTexto(5)).toBe("1,5");
    expect(piesAMetrosTexto(10)).toBe("3");
    expect(piesAMetrosTexto(60)).toBe("18");
  });
});

describe("pulirTextoReglasEs", () => {
  it("normaliza términos de juego y distancias", () => {
    const text = pulirTextoReglasEs(
      "Tras un Descanso Largo, ganas Ventaja y Reacción a 30 pies. Daño Radiante y 5 PV.",
    );
    expect(text).toContain("descanso largo");
    expect(text).toContain("ventaja");
    expect(text).toContain("reacción");
    expect(text).toContain("9 metros");
    expect(text).toContain("daño radiante");
    expect(text).toContain("puntos de golpe");
    expect(text).not.toMatch(/\bDescanso Largo\b/);
    expect(text).not.toMatch(/\b30 pies\b/i);
  });

  it("unifica encabezado de nivel superior en conjuros", () => {
    expect(pulirTextoReglasEs("Usando un espacio de conjuro de nivel superior:")).toContain(
      "Usar un espacio de conjuro de nivel superior",
    );
  });

  it("no convierte metros ya presentes", () => {
    expect(pulirTextoReglasEs("Alcance de 18 metros.")).toBe("Alcance de 18 metros.");
  });
});
