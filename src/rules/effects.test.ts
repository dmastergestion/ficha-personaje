import { describe, expect, it } from "vitest";
import {
  aplicarCondicionesPersonaje,
  calcularModificadoresCondiciones,
  condicionRompeConcentracion,
  resolverModoTirada,
  tiradaSalvacion,
} from "@/rules/effects";
import { crearPersonajeVacio } from "@/schemas/character";

describe("calcularModificadoresCondiciones", () => {
  it("aplica autofallo str/dex en paralizado", () => {
    const mods = calcularModificadoresCondiciones(["paralyzed"]);
    expect(mods.salvacionAutoFallo.has("str")).toBe(true);
    expect(mods.salvacionAutoFallo.has("dex")).toBe(true);
  });

  it("no aplica desventaja de 2014: el agotamiento 2024 va al d20", () => {
    const mods = calcularModificadoresCondiciones([], 3);
    expect(mods.desventajaAtaques).toBe(false);
    expect(mods.desventajaSalvaciones).toBe(false);
    expect(mods.desventajaPericias).toBe(false);
    expect(mods.multiplicadorVelocidad).toBe(1);
  });

  it("envenenado 2024 da desventaja a todas las pruebas d20", () => {
    const mods = calcularModificadoresCondiciones(["poisoned"]);
    expect(mods.desventajaAtaques).toBe(true);
    expect(mods.desventajaPericias).toBe(true);
    expect(mods.desventajaSalvaciones).toBe(true);
  });

  it("incapacitado rompe la concentración", () => {
    expect(condicionRompeConcentracion(["incapacitated"])).toBe(true);
    expect(condicionRompeConcentracion(["paralyzed"])).toBe(true);
    expect(condicionRompeConcentracion(["poisoned"])).toBe(false);
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    pj.spells.concentratingOn = "hold-person";
    const next = aplicarCondicionesPersonaje(pj, ["stunned"]);
    expect(next.spells.concentratingOn).toBeNull();
  });

  it("velocidad cero en agarrado", () => {
    const mods = calcularModificadoresCondiciones(["grappled"]);
    expect(mods.velocidadCero).toBe(true);
  });

  it("paralizado y petrificado ponen velocidad a 0", () => {
    expect(calcularModificadoresCondiciones(["paralyzed"]).velocidadCero).toBe(true);
    expect(calcularModificadoresCondiciones(["petrified"]).velocidadCero).toBe(true);
    expect(calcularModificadoresCondiciones(["stunned"]).velocidadCero).toBe(true);
    expect(calcularModificadoresCondiciones(["unconscious"]).velocidadCero).toBe(true);
  });
});

describe("resolverModoTirada", () => {
  it("anula ventaja y desventaja simultáneas", () => {
    expect(resolverModoTirada("normal", true, true)).toBe("normal");
  });

  it("aplica desventaja extra", () => {
    expect(resolverModoTirada("normal", false, true)).toBe("disadvantage");
  });
});

describe("tiradaSalvacion", () => {
  it("autofalla dex si está paralizado", () => {
    const result = tiradaSalvacion(3, "dex", "normal", ["paralyzed"], 0);
    expect(result).toEqual({ autoFallo: true, razon: "Autofallo por condición" });
  });

  it("resta 2 por nivel de agotamiento al total del d20", () => {
    const result = tiradaSalvacion(4, "wis", "normal", [], 3, {
      source: "physical",
      manual: { die1: 12 },
    });
    expect("autoFallo" in result).toBe(false);
    if ("autoFallo" in result) return;
    expect(result.modifier).toBe(-2);
    expect(result.total).toBe(10);
  });

  it("envenenado impone desventaja en salvación", () => {
    const result = tiradaSalvacion(0, "con", "normal", ["poisoned"], 0, {
      source: "physical",
      manual: { die1: 18, die2: 4 },
    });
    expect("autoFallo" in result).toBe(false);
    if ("autoFallo" in result) return;
    expect(result.mode).toBe("disadvantage");
    expect(result.used).toBe(4);
  });
});
