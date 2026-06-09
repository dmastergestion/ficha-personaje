import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { dadosGolpeDisponibles, etiquetaDadosGolpe } from "@/rules/hit-dice";

describe("dadosGolpeDisponibles", () => {
  it("muestra disponibles, no gastados", () => {
    const c = crearPersonajeVacio({
      name: "T",
      playerName: "P",
      classId: "fighter",
      level: 1,
    });
    c.combat.hitDiceTotal = 1;
    c.combat.hitDiceUsed = 1;
    expect(dadosGolpeDisponibles(c)).toEqual({ disponibles: 0, gastados: 1, total: 1 });
    expect(etiquetaDadosGolpe(c)).toBe("0/1");
  });
});
