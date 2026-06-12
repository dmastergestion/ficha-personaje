import { describe, expect, it } from "vitest";
import {
  ATAQUE_DESARMADO_ID,
  idAtaqueDefecto,
  marcarAtaqueDefecto,
  modificadorAtaque,
} from "@/rules/attacks";
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

  it("recuerda el ataque predeterminado", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    expect(idAtaqueDefecto(character)).toBe(ATAQUE_DESARMADO_ID);

    const conEspada = marcarAtaqueDefecto(
      {
        ...character,
        equipment: {
          ...character.equipment,
          items: [
            {
              id: "espada-1",
              name: "Espada larga",
              qty: 1,
              weightLb: 3,
              weaponId: "longsword",
            },
          ],
        },
      },
      "espada-1",
    );
    expect(idAtaqueDefecto(conEspada)).toBe("espada-1");
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
