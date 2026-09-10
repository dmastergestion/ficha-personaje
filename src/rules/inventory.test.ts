import { describe, expect, it } from "vitest";
import {
  bonusCaObjetosMagicos,
  capacidadCarga,
  estadoCarga,
  pesoTotalInventario,
  resistenciasObjetosMagicos,
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

  it("CA y resistencias de objetos solo si están sintonizados cuando lo requieren", () => {
    const items = [
      {
        id: "1",
        name: "Anillo",
        qty: 1,
        weightLb: 0,
        requiresAttunement: true,
        attuned: false,
        acBonus: 1,
        grantedResistances: ["fuego"],
      },
      {
        id: "2",
        name: "Capa",
        qty: 1,
        weightLb: 1,
        requiresAttunement: true,
        attuned: true,
        acBonus: 1,
        grantedResistances: ["frío"],
      },
    ];
    expect(bonusCaObjetosMagicos(items)).toBe(1);
    expect(resistenciasObjetosMagicos(items)).toEqual(["frío"]);
  });
});
