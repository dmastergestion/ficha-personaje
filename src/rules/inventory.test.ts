import { describe, expect, it } from "vitest";
import {
  capacidadCarga,
  estadoCarga,
  pesoTotalInventario,
} from "@/rules/inventory";

describe("inventory", () => {
  it("calcula capacidad STR × 15", () => {
    expect(capacidadCarga(16)).toBe(240);
  });

  it("detecta sobrecarga", () => {
    const peso = pesoTotalInventario([
      { id: "1", name: "Cofre", qty: 2, weightLb: 100 },
    ]);
    expect(peso).toBe(200);
    expect(estadoCarga(10, peso)).toBe("sobrecarga");
    expect(estadoCarga(20, peso)).toBe("ligera");
  });
});
