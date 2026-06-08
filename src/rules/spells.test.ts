import { describe, expect, it } from "vitest";
import { espaciosMaximos, esLanzador, tipoLanzador } from "@/rules/spells";

describe("espaciosMaximos", () => {
  it("mago nivel 1 tiene 2 espacios de nivel 1", () => {
    expect(espaciosMaximos("wizard", 1)["1"]).toBe(2);
  });

  it("guerrero no lanza conjuros", () => {
    expect(esLanzador("fighter")).toBe(false);
    expect(espaciosMaximos("fighter", 5)["1"]).toBe(0);
  });

  it("paladín nivel 2 tiene espacios de medio lanzador", () => {
    expect(tipoLanzador("paladin")).toBe("half");
    expect(espaciosMaximos("paladin", 2)["1"]).toBe(2);
  });

  it("brujo usa espacios de pacto", () => {
    expect(tipoLanzador("warlock")).toBe("pact");
    expect(espaciosMaximos("warlock", 1)["1"]).toBe(1);
  });
});
