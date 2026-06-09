import { describe, expect, it } from "vitest";
import { modificadorAtaque } from "@/rules/attacks";
import { crearPersonajeVacio } from "@/schemas/character";

describe("modificadorAtaque", () => {
  it("suma competencia si el ataque es proficiente", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    character.abilities.str = 16;
    character.identity.level = 5;

    expect(
      modificadorAtaque(character, {
        id: "1",
        name: "Espada",
        abilityKey: "str",
        proficient: true,
      }),
    ).toBe(6);
  });

  it("suma bonificador magico al ataque", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    character.abilities.str = 16;

    expect(
      modificadorAtaque(character, {
        id: "1",
        name: "Espada +2",
        abilityKey: "str",
        proficient: true,
        magicBonus: 2,
      }),
    ).toBe(7);
  });

  it("no suma competencia si no es proficiente", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    character.abilities.str = 16;

    expect(
      modificadorAtaque(character, {
        id: "1",
        name: "Golpe",
        abilityKey: "str",
        proficient: false,
      }),
    ).toBe(3);
  });
});
