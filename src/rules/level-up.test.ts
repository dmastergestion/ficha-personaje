import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  aplicarBajadaNivel,
  aplicarSubidaNivel,
  detectarBajadaNivel,
  detectarSubidaNivel,
  prepararSubidaNivel,
  pvGanadoAlSubir,
} from "@/rules/level-up";

describe("detectarSubidaNivel", () => {
  it("detecta subida en clase existente", () => {
    const antes = [{ classId: "wizard", subclassId: null, level: 2 }];
    const despues = [{ classId: "wizard", subclassId: null, level: 3 }];
    expect(detectarSubidaNivel(antes, despues)).toEqual({
      classId: "wizard",
      oldLevel: 2,
      newLevel: 3,
      isFirstLevelInClass: false,
    });
  });

  it("detecta primera clase multiclase", () => {
    const antes = [{ classId: "fighter", subclassId: null, level: 5 }];
    const despues = [
      { classId: "fighter", subclassId: null, level: 5 },
      { classId: "wizard", subclassId: null, level: 1 },
    ];
    expect(detectarSubidaNivel(antes, despues)?.isFirstLevelInClass).toBe(true);
  });
});

describe("prepararSubidaNivel", () => {
  it("incluye rasgos y cambio de PB al cruzar nivel 5", () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "P",
      classId: "fighter",
      level: 4,
    });
    const character = {
      ...base,
      identity: {
        ...base.identity,
        classes: [{ classId: "fighter", subclassId: null, level: 4 }],
        level: 4,
      },
      abilities: { ...base.abilities, con: 14 },
    };
    const newClasses = [{ classId: "fighter", subclassId: null, level: 5 }];
    const preview = prepararSubidaNivel(character, newClasses);
    expect(preview).not.toBeNull();
    expect(preview!.totalLevelAfter).toBe(5);
    expect(preview!.pbAfter).toBe(3);
    expect(preview!.milestones.some((m) => m.includes("Ataque adicional"))).toBe(true);
  });
});

describe("aplicarSubidaNivel", () => {
  it("aumenta PV máximos y dados de golpe", () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "P",
      classId: "wizard",
      level: 1,
    });
    const character = {
      ...base,
      identity: {
        ...base.identity,
        classes: [{ classId: "wizard", subclassId: null, level: 1 }],
        level: 1,
      },
      combat: { ...base.combat, hpMax: 8, hpCurrent: 6, hitDiceTotal: 1 },
    };
    const newClasses = [{ classId: "wizard", subclassId: null, level: 2 }];
    const next = aplicarSubidaNivel(character, newClasses, 5, true);
    expect(next.identity.level).toBe(2);
    expect(next.combat.hpMax).toBe(13);
    expect(next.combat.hpCurrent).toBe(11);
    expect(next.combat.hitDiceTotal).toBe(2);
  });
});

describe("aplicarBajadaNivel", () => {
  it("reduce PV y dados al bajar de nivel", () => {
    const base = crearPersonajeVacio({
      name: "Test",
      playerName: "P",
      classId: "wizard",
      level: 2,
    });
    const character = {
      ...base,
      identity: {
        ...base.identity,
        classes: [{ classId: "wizard", subclassId: null, level: 2 }],
        level: 2,
      },
      combat: { ...base.combat, hpMax: 14, hpCurrent: 14, hitDiceTotal: 2 },
    };
    const next = aplicarBajadaNivel(character, [
      { classId: "wizard", subclassId: null, level: 1 },
    ]);
    expect(next.identity.level).toBe(1);
    expect(next.combat.hpMax).toBeLessThan(14);
    expect(next.combat.hitDiceTotal).toBe(1);
  });
});

describe("detectarBajadaNivel", () => {
  it("detecta bajada en clase", () => {
    const antes = [{ classId: "fighter", subclassId: null, level: 3 }];
    const despues = [{ classId: "fighter", subclassId: null, level: 2 }];
    expect(detectarBajadaNivel(antes, despues)?.newLevel).toBe(2);
  });
});

describe("pvGanadoAlSubir", () => {
  it("primer nivel en clase usa máximo del dado", () => {
    const gain = pvGanadoAlSubir("fighter", 14, true);
    expect(gain.isFirstLevelInClass).toBe(true);
    expect(gain.average).toBe(gain.maximum);
  });
});
