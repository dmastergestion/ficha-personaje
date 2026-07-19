import { describe, expect, it } from "vitest";
import {
  formatoDistanciaDual,
  piesAMetrosTexto,
  pulirTextoReglasEs,
  traducirAlcanceConjuro,
  unificarDistanciasEnTexto,
} from "@/lib/rules-text-polish";

describe("formatoDistanciaDual", () => {
  it("muestra pies y metros", () => {
    expect(formatoDistanciaDual(30)).toBe("30 pies (9 m)");
    expect(formatoDistanciaDual(5)).toBe("5 pies (1,5 m)");
  });
});

describe("piesAMetrosTexto", () => {
  it("convierte múltiplos de 5 pies", () => {
    expect(piesAMetrosTexto(5)).toBe("1,5");
    expect(piesAMetrosTexto(10)).toBe("3");
    expect(piesAMetrosTexto(60)).toBe("18");
  });
});

describe("traducirAlcanceConjuro", () => {
  it("convierte pies, metros y armas a distancia dual", () => {
    expect(traducirAlcanceConjuro("30 pies")).toBe("30 pies (9 m)");
    expect(traducirAlcanceConjuro("9 metros")).toBe("30 pies (9 m)");
    expect(traducirAlcanceConjuro("15 feet")).toBe("15 pies (4,5 m)");
    expect(traducirAlcanceConjuro("20/60")).toBe("20/60 pies (6/18 m)");
    expect(traducirAlcanceConjuro("touch")).toBe("Toque");
    expect(traducirAlcanceConjuro("point")).toBeUndefined();
  });
});

describe("unificarDistanciasEnTexto", () => {
  it("es idempotente con formato dual", () => {
    const dual = "Radio de 30 pies (9 m).";
    expect(unificarDistanciasEnTexto(dual)).toBe(dual);
  });
});

describe("pulirTextoReglasEs", () => {
  it("normaliza términos de juego y distancias dual", () => {
    const text = pulirTextoReglasEs(
      "Tras un Descanso Largo, ganas Ventaja y Reacción a 30 pies. Daño Radiante y 5 PV.",
    );
    expect(text).toContain("descanso largo");
    expect(text).toContain("ventaja");
    expect(text).toContain("reacción");
    expect(text).toContain("30 pies (9 m)");
    expect(text).toContain("daño radiante");
    expect(text).toContain("puntos de golpe");
    expect(text).not.toMatch(/\bDescanso Largo\b/);
  });

  it("unifica encabezado de nivel superior en conjuros", () => {
    expect(pulirTextoReglasEs("Usando un espacio de conjuro de nivel superior:")).toContain(
      "Usar un espacio de conjuro de nivel superior",
    );
  });

  it("convierte metros sueltos a dual", () => {
    expect(pulirTextoReglasEs("Alcance de 18 metros.")).toBe("Alcance de 60 pies (18 m).");
  });

  it("normaliza áreas de efecto y artefactos Foundry", () => {
    const text = pulirTextoReglasEs(
      "Cada criatura en un Cubo de 10 pies con charmed apply=false y difficultterrain. Emanación de 30 pies.",
    );
    expect(text).toContain("cubo de 10 pies (3 m)");
    expect(text).toContain("hechizado");
    expect(text).toContain("terreno difícil");
    expect(text).toContain("emanación de 30 pies (9 m)");
  });

  it("traduce niveles de luz Foundry (DimLight, BrightLight)", () => {
    const text = pulirTextoReglasEs(
      "emite DimLight en un radio de 10 pies. Ilumina con BrightLight y dimlight adicional. dimlight o darkness.",
    );
    expect(text).toContain("emite luz tenue");
    expect(text).toContain("luz brillante");
    expect(text).not.toMatch(/DimLight|BrightLight|dimlight|brightlight/i);
    expect(text).toContain("luz tenue u oscuridad");
  });

  it("traduce sentidos y descansos en inglés del compendio", () => {
    const text = pulirTextoReglasEs(
      "Un atacante con truesight o blindsight te percibe. Obtienes los beneficios de un shortrest y de un longrest.",
    );
    expect(text).toContain("visión verdadera");
    expect(text).toContain("visión ciega");
    expect(text).toContain("descanso corto");
    expect(text).toContain("descanso largo");
    expect(text).not.toMatch(/truesight|blindsight|shortrest|longrest/i);
  });

  it("elimina plantillas de escalado sin resolver y expande PG", () => {
    expect(pulirTextoReglasEs("El conjuro crea un dardo más.\n{Level  darts}")).toBe(
      "El conjuro crea un dardo más.",
    );
    expect(pulirTextoReglasEs("Recuperas 5 PG.")).toContain("puntos de golpe");
  });

  it("unifica «Clase de Armadura» a «CA»", () => {
    const text = pulirTextoReglasEs(
      "Tienes una Clase de Armadura de 17 y un bonificador de +2 a la clase de armadura.",
    );
    expect(text).toBe("Tienes una CA de 17 y un bonificador de +2 a la CA.");
    expect(text).not.toMatch(/clase de armadura/i);
  });
});
