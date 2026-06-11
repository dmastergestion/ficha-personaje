import { describe, expect, it } from "vitest";
import {
  limpiarTextoOrigen,
  personalizarEspeciePorId,
  pulirDescripcionEspecie,
} from "@/lib/origin-text";

describe("limpiarTextoOrigen", () => {
  it("elimina marcadores 5etools", () => {
    const text = limpiarTextoOrigen(
      "Healing Hands: As a {@action Magic|XPHB} action, roll {@dice 1d4|XPHB}.",
    );
    expect(text).not.toContain("{@");
    expect(text).not.toContain("XPHB");
  });
});

describe("pulirDescripcionEspecie", () => {
  it("quita cabecera mecánica de especie Foundry", () => {
    const raw = [
      "Rasgos de humano",
      "",
      "Tipo de criatura: Humanoide",
      "",
      "Velocidad: 30 pies",
      "",
      "Como humano, tienes los siguientes rasgos especiales.",
      "",
      "Hábil. Obtienes competencia en una habilidad de tu elección.",
    ].join("\n");

    const out = pulirDescripcionEspecie(raw);
    expect(out).not.toMatch(/^Rasgos de/i);
    expect(out).not.toContain("Tipo de criatura");
    expect(out).toContain("competencia en una pericia");
  });
});

describe("personalizarEspeciePorId", () => {
  it("fija ancestro dracónico en subrazas", () => {
    const base = [
      "Ascendencia dracónica. Elige ancestro.",
      "",
      "Ancestros dracónicos:",
      "Negro — ácido | Dorado — fuego",
      "Azul — relámpago | Verde — veneno",
      "Latón — fuego | Rojo — fuego",
      "Bronce — relámpago | Plateado — frío",
      "Cobrizo — ácido | Blanco — frío",
      "",
      "Resistencia al daño. Tienes resistencia al tipo de daño de tu ancestro dracónico.",
    ].join("\n");

    const out = personalizarEspeciePorId("dragonborn-red", base);
    expect(out).toContain("dragón rojo");
    expect(out).toContain("daño de fuego");
    expect(out).not.toContain("Ancestros dracónicos:");
  });

  it("añade ancestro gigante en subrazas de goliat", () => {
    const out = personalizarEspeciePorId("goliath-storm-giant", "Forma grande.");
    expect(out).toMatch(/^Ancestro gigante: gigante de tormenta\./);
  });
});
