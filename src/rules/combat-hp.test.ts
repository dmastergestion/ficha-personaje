import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { aplicarCambioPv, aplicarDeltaPvPersonaje } from "@/rules/combat-hp";

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

  it("a 0 PV el daño extra suma un fallo de muerte", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.combat.hpCurrent = 0;
    const result = aplicarDeltaPvPersonaje(pj, -4);
    expect(result.character.combat.deathSaves.failures).toBe(1);
    expect(result.damageTaken).toBe(4);
  });

  it("muerte instantánea si el remanente al caer a 0 es ≥ PV máx", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.combat.hpCurrent = 5;
    pj.combat.hpMax = 20;
    pj.combat.hpTemp = 0;
    const result = aplicarDeltaPvPersonaje(pj, -30);
    expect(result.character.combat.hpCurrent).toBe(0);
    expect(result.character.combat.deathSaves.failures).toBe(3);
    expect(result.deathMessage).toMatch(/instantánea/i);
  });

  it("muerte instantánea si ya estás a 0 y el daño ≥ PV máx", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.combat.hpCurrent = 0;
    pj.combat.hpMax = 12;
    const result = aplicarDeltaPvPersonaje(pj, -12);
    expect(result.character.combat.deathSaves.failures).toBe(3);
    expect(result.deathMessage).toMatch(/instantánea/i);
  });
});
