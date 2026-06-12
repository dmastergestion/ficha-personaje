import { describe, expect, it } from "vitest";
import { dadosGolpeDisponibles, poolDadosGolpe, recuperarDadosDescansoLargo } from "@/rules/hit-dice";
import { crearPersonajeVacio } from "@/schemas/character";

describe("dadosGolpeDisponibles", () => {
  it("cuenta disponibles y gastados", () => {
    const c = crearPersonajeVacio({ name: "X", playerName: "", classId: "fighter" });
    c.combat.hitDiceTotal = 1;
    c.combat.hitDiceUsed = 1;
    c.combat.hitDiceSpentByDie = { d10: 1 };
    expect(dadosGolpeDisponibles(c)).toEqual({ disponibles: 0, gastados: 1, total: 1 });
  });

  it("respeta el pool por denominación en multiclase", () => {
    const c = crearPersonajeVacio({ name: "X", playerName: "", classId: "fighter" });
    c.identity.classes = [
      { classId: "fighter", subclassId: null, level: 2 },
      { classId: "wizard", subclassId: null, level: 1 },
    ];
    c.combat.hitDiceTotal = 3;
    c.combat.hitDiceSpentByDie = { d10: 2 };
    c.combat.hitDiceUsed = 2;
    const pool = poolDadosGolpe(c);
    expect(pool.find((p) => p.die === "d10")?.disponibles).toBe(0);
    expect(pool.find((p) => p.die === "d6")?.disponibles).toBe(1);
    expect(dadosGolpeDisponibles(c).disponibles).toBe(1);
  });
});

describe("recuperarDadosDescansoLargo", () => {
  it("devuelve dados gastados al descanso largo", () => {
    const next = recuperarDadosDescansoLargo({ d8: 2, d10: 1 }, 2);
    expect(next).toEqual({ d10: 1 });
  });
});
