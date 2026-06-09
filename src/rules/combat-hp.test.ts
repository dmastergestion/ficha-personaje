import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { aplicarCambioPv } from "@/rules/combat-hp";

describe("aplicarCambioPv", () => {
  it("el daño agota primero los PV temporales", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat;
    const combat = { ...base, hpCurrent: 20, hpMax: 20, hpTemp: 5 };

    const result = aplicarCambioPv(combat, -8);

    expect(result.hpTemp).toBe(0);
    expect(result.hpCurrent).toBe(17);
  });

  it("la curación no supera el máximo y no toca los PV temp", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat;
    const combat = { ...base, hpCurrent: 10, hpMax: 20, hpTemp: 5 };

    const result = aplicarCambioPv(combat, 7);

    expect(result.hpCurrent).toBe(17);
    expect(result.hpTemp).toBe(5);
  });

  it("aplica resistencia al daño", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat;
    const combat = {
      ...base,
      hpCurrent: 20,
      damageResistances: ["fuego"],
    };
    const result = aplicarCambioPv(combat, -10, { damageType: "fuego" });
    expect(result.hpCurrent).toBe(15);
  });

  it("aplica inmunidad al daño", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat;
    const combat = {
      ...base,
      hpCurrent: 20,
      damageImmunities: ["veneno"],
    };
    const result = aplicarCambioPv(combat, -10, { damageType: "veneno" });
    expect(result.hpCurrent).toBe(20);
  });
});
