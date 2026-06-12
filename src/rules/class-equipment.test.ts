import { describe, expect, it } from "vitest";
import { ORIGIN_CHOICES_EMPTY } from "@/rules/origin-choices";
import {
  aplicarEquipoClase,
  ORIGIN_CLASS_EQUIPMENT_NOTE,
  parsearPaqueteEquipoClase,
} from "@/rules/class-equipment";
import { crearPersonajeVacio } from "@/schemas/character";

describe("parsearPaqueteEquipoClase", () => {
  it("parsea el paquete A del guerrero con armadura y armas", () => {
    const paquete = parsearPaqueteEquipoClase("fighter", "A", ORIGIN_CHOICES_EMPTY);
    expect(paquete).not.toBeNull();
    expect(paquete!.armorId).toBe("chain-mail");
    expect(paquete!.gp).toBe(4);
    expect(paquete!.items.some((i) => i.weaponId === "greatsword")).toBe(true);
    expect(paquete!.items.some((i) => i.weaponId === "javelin")).toBe(true);
    expect(paquete!.items.every((i) => i.notes === ORIGIN_CLASS_EQUIPMENT_NOTE)).toBe(true);
  });

  it("parsea el paquete A del mago con bastón y daggers", () => {
    const paquete = parsearPaqueteEquipoClase("wizard", "A", ORIGIN_CHOICES_EMPTY);
    expect(paquete).not.toBeNull();
    expect(paquete!.items.filter((i) => i.weaponId === "dagger")).toHaveLength(1);
    expect(paquete!.items.some((i) => i.weaponId === "quarterstaff")).toBe(true);
    expect(paquete!.gp).toBe(5);
  });

  it("parsea el paquete B como oro", () => {
    const paquete = parsearPaqueteEquipoClase("fighter", "C", ORIGIN_CHOICES_EMPTY);
    expect(paquete).toEqual({
      items: [],
      gp: 155,
      armorId: null,
      shieldEquipped: false,
    });
  });
});

describe("aplicarEquipoClase", () => {
  it("equipa armadura, escudo y armas al paladín", () => {
    const base = crearPersonajeVacio({ name: "Paladín", playerName: "", classId: "paladin" });
    const character = {
      ...base,
      originChoices: {
        species: {},
        background: {},
        class: { equipment: "A" },
      },
    };
    const result = aplicarEquipoClase(character);
    expect(result.equipment.armorId).toBe("chain-mail");
    expect(result.equipment.shieldEquipped).toBe(true);
    expect(result.equipment.items.some((i) => i.weaponId === "longsword")).toBe(true);
    expect(result.equipment.defaultAttackId).toBeTruthy();
    expect(result.equipment.currency.gp).toBe(9);
  });
});
