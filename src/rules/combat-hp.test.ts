import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { aplicarCambioPv, aplicarCambioPvConConcentracion, aplicarDeltaPvPersonaje } from "@/rules/combat-hp";

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

  it("rabia resiste contundente/perforante/cortante, no elemental", () => {
    const combat = {
      ...crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian" }).combat,
      hpCurrent: 20,
      raging: true,
    };
    expect(aplicarCambioPv(combat, -10, { damageType: "cortante" }).hpCurrent).toBe(15);
    expect(aplicarCambioPv(combat, -10, { damageType: "fuego" }).hpCurrent).toBe(10);
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

  it("con rabia no aplica daño sin tipo", () => {
    const pj = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian" });
    pj.combat.hpCurrent = 18;
    pj.combat.hpMax = 18;
    pj.combat.raging = true;
    const sinTipo = aplicarDeltaPvPersonaje(pj, -5);
    expect(sinTipo.character.combat.hpCurrent).toBe(18);
    expect(sinTipo.damageTaken).toBe(0);
    expect(sinTipo.warning).toMatch(/tipo de daño/i);

    const cortante = aplicarDeltaPvPersonaje(pj, -10, { damageType: "cortante" });
    expect(cortante.character.combat.hpCurrent).toBe(13);
    expect(cortante.damageTaken).toBe(5);
    expect(cortante.warning).toBeUndefined();
  });

  it("la concentración usa el daño tras resistencia de rabia", () => {
    const pj = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian" });
    pj.combat.hpCurrent = 40;
    pj.combat.hpMax = 40;
    pj.combat.raging = true;
    pj.spells.concentratingOn = "hunter-s-mark";
    const result = aplicarCambioPvConConcentracion(
      pj,
      -24,
      "normal",
      { source: "virtual" },
      { damageType: "cortante" },
    );
    expect(result.character.combat.hpCurrent).toBe(28);
    expect(result.damageTaken).toBe(12);
    expect(result.concentration?.dc).toBe(10);
  });
});
