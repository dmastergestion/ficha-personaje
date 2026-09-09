import { describe, expect, it } from "vitest";
import {
  ATAQUE_DESARMADO_ID,
  accionBarraCombate,
  alternarEnCombate,
  ataqueDesdeItem,
  golpeDesarmadoPersonaje,
  idAtaqueDefecto,
  listarAtaquesFicha,
  marcarAtaqueDefecto,
  modificadorAtaque,
  PACT_WEAPON_ATTACK_ID,
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

describe("arma de pacto", () => {
  it("aparece como ataque con Carisma si no está en el inventario", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "warlock" });
    character.abilities.cha = 16;
    character.originChoices = {
      species: {},
      background: {},
      class: { "eldritch-invocations": "pact-of-the-blade", "pact-weapon": "rapier" },
    };

    const rows = listarAtaquesFicha(character);
    const pacto = rows.find((r) => r.id === PACT_WEAPON_ATTACK_ID);
    expect(pacto).toBeDefined();
    expect(pacto?.attack.abilityKey).toBe("cha");
    expect(pacto?.attack.proficient).toBe(true);
    expect(pacto?.attack.damage).toContain("MOD CAR");
    expect(modificadorAtaque(character, pacto!.attack)).toBe(5);
  });

  it("usa Carisma en el arma del inventario vinculada", () => {
    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "warlock" });
    character.abilities.cha = 16;
    character.abilities.dex = 10;
    character.originChoices = {
      species: {},
      background: {},
      class: { "eldritch-invocations": "pact-of-the-blade", "pact-weapon": "rapier" },
    };
    character.equipment.items = [
      { id: "estoque-1", name: "Estoque", qty: 1, weightLb: 2, weaponId: "rapier" },
    ];

    expect(listarAtaquesFicha(character).some((r) => r.id === PACT_WEAPON_ATTACK_ID)).toBe(false);
    const attack = ataqueDesdeItem(character.equipment.items[0]!, character)!;
    expect(attack.abilityKey).toBe("cha");
    expect(attack.damage).toContain("MOD CAR");
    expect(modificadorAtaque(character, attack)).toBe(5);
  });
});

describe("accionBarraCombate", () => {
  it("usa descarga arcana si no hay arma predeterminada", () => {
    const character = crearPersonajeVacio({ name: "W", playerName: "J", classId: "warlock" });
    character.spells.cantripsKnown = ["eldritch-blast", "prestidigitation"];
    const accion = accionBarraCombate(character);
    expect(accion).toEqual({
      tipo: "truco",
      id: "eldritch-blast",
      etiqueta: expect.any(String),
    });
    expect(accion.etiqueta.toLowerCase()).toMatch(/descarga|eldritch|blast/i);
  });

  it("prioriza el arma marcada como predeterminada", () => {
    const character = crearPersonajeVacio({ name: "W", playerName: "J", classId: "warlock" });
    character.spells.cantripsKnown = ["eldritch-blast"];
    character.equipment.items = [
      { id: "daga-1", name: "Daga", qty: 1, weightLb: 1, weaponId: "dagger" },
    ];
    const conDaga = marcarAtaqueDefecto(character, "daga-1");
    expect(accionBarraCombate(conDaga)).toMatchObject({ tipo: "arma", id: "daga-1" });
  });

  it("permite varias armas en combate a la vez", () => {
    let character = crearPersonajeVacio({ name: "F", playerName: "J", classId: "fighter" });
    character = {
      ...character,
      equipment: {
        ...character.equipment,
        items: [
          {
            id: "espada-1",
            name: "Espada",
            qty: 1,
            weightLb: 3,
            weaponId: "longsword",
            inCombat: false,
          },
          {
            id: "daga-1",
            name: "Daga",
            qty: 1,
            weightLb: 1,
            weaponId: "dagger",
            inCombat: false,
          },
        ],
      },
    };
    character = alternarEnCombate(character, "espada-1");
    character = alternarEnCombate(character, "daga-1");
    const ids = listarAtaquesFicha(character).map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(["espada-1", "daga-1"]));
  });
});

describe("estilos, sutil y artes marciales", () => {
  it("arma sutil usa el mayor entre FUE y DES", () => {
    const pj = crearPersonajeVacio({ name: "R", playerName: "J", classId: "rogue" });
    pj.abilities.str = 10;
    pj.abilities.dex = 16;
    const attack = ataqueDesdeItem(
      { id: "r1", name: "Estoque", qty: 1, weightLb: 2, weaponId: "rapier" },
      pj,
    )!;
    expect(attack.abilityKey).toBe("dex");
  });

  it("Tiro con arco suma +2 a ataques a distancia", () => {
    const pj = crearPersonajeVacio({ name: "F", playerName: "J", classId: "fighter" });
    pj.abilities.dex = 16;
    pj.feats = [{ id: "archery", name: "Tiro con arco" }];
    pj.proficiencies.weaponProficiencies = ["simple", "martial"];
    const attack = ataqueDesdeItem(
      { id: "b1", name: "Arco", qty: 1, weightLb: 2, weaponId: "longbow" },
      pj,
    )!;
    expect(modificadorAtaque(pj, attack)).toBe(3 + 2 + 2); // DES + PB + arco
  });

  it("golpe desarmado de monje usa dado de artes marciales y DES o FUE", () => {
    const pj = crearPersonajeVacio({ name: "M", playerName: "J", classId: "monk" });
    pj.abilities.dex = 16;
    pj.abilities.str = 10;
    const golpe = golpeDesarmadoPersonaje(pj);
    expect(golpe.abilityKey).toBe("dex");
    expect(golpe.damage).toMatch(/1d6/);
  });
});
