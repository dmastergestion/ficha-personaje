import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { registrarFalloSalvacionMuerte, resetearSalvacionesMuerte } from "@/rules/death-saves";
import { aplicarCambioPv } from "@/rules/combat-hp";

describe("death-saves", () => {
  it("resetea salvaciones al curar desde 0 PV", () => {
    const combat = {
      ...crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat,
      hpCurrent: 0,
      deathSaves: { successes: 2, failures: 1 },
    };
    const next = aplicarCambioPv(combat, 5);
    expect(next.hpCurrent).toBeGreaterThan(0);
    expect(next.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it("acumula fallos hasta la muerte", () => {
    const combat = {
      ...crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat,
      hpCurrent: 0,
      deathSaves: { successes: 0, failures: 0 },
    };
    const r1 = registrarFalloSalvacionMuerte(combat, 1);
    expect(r1.combat.deathSaves.failures).toBe(1);
    const r2 = registrarFalloSalvacionMuerte(r1.combat, 2);
    expect(r2.outcome).toBe("dead");
  });

  it("resetearSalvacionesMuerte limpia contadores", () => {
    const combat = {
      ...crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" }).combat,
      deathSaves: { successes: 1, failures: 2 },
    };
    expect(resetearSalvacionesMuerte(combat).deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});
