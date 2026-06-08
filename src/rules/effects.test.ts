import { describe, expect, it } from "vitest";
import {
  calcularModificadoresCondiciones,
  resolverModoTirada,
  tiradaSalvacion,
} from "@/rules/effects";

describe("calcularModificadoresCondiciones", () => {
  it("aplica autofallo str/dex en paralizado", () => {
    const mods = calcularModificadoresCondiciones(["paralyzed"]);
    expect(mods.salvacionAutoFallo.has("str")).toBe(true);
    expect(mods.salvacionAutoFallo.has("dex")).toBe(true);
  });

  it("combina agotamiento nivel 3 con desventaja en ataques", () => {
    const mods = calcularModificadoresCondiciones([], 3);
    expect(mods.desventajaAtaques).toBe(true);
    expect(mods.desventajaSalvaciones).toBe(true);
  });

  it("velocidad cero en agarrado", () => {
    const mods = calcularModificadoresCondiciones(["grappled"]);
    expect(mods.velocidadCero).toBe(true);
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
});
