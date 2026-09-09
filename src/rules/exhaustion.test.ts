import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { ajustarAgotamiento, aplicarAgotamientoAlRecuperarPg, fijarAgotamiento } from "@/rules/exhaustion";

describe("exhaustion (PHB 2024)", () => {
  it("muerte al nivel 6: 0 PV y tres fallos de salvación", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    base.combat.hpCurrent = 42;

    const dead = fijarAgotamiento(base, 6);

    expect(dead.combat.exhaustionLevel).toBe(6);
    expect(dead.combat.hpCurrent).toBe(0);
    expect(dead.combat.deathSaves.failures).toBe(3);
  });

  it("niveles 0–5 no matan por sí solos", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    base.combat.hpCurrent = 20;

    const tired = fijarAgotamiento(base, 5);

    expect(tired.combat.exhaustionLevel).toBe(5);
    expect(tired.combat.hpCurrent).toBe(20);
    expect(tired.combat.deathSaves.failures).toBe(0);
  });

  it("ajustarAgotamiento aplica muerte al cruzar el umbral", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    base.combat.exhaustionLevel = 5;
    base.combat.hpCurrent = 15;

    const dead = ajustarAgotamiento(base, 1);

    expect(dead.combat.exhaustionLevel).toBe(6);
    expect(dead.combat.hpCurrent).toBe(0);
    expect(dead.combat.deathSaves.failures).toBe(3);
  });

  it("aplicarAgotamientoAlRecuperarPg suma un nivel", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    base.combat.exhaustionLevel = 3;

    expect(aplicarAgotamientoAlRecuperarPg(base.combat).exhaustionLevel).toBe(4);
  });
});
