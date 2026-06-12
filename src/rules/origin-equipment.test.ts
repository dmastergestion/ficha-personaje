import { describe, expect, it } from "vitest";
import backgroundMeta from "@/data/srd/background-meta.json";
import { ORIGIN_CHOICES_EMPTY } from "@/rules/origin-choices";
import {
  aplicarEquipoTrasfondo,
  ORIGIN_BG_EQUIPMENT_NOTE,
  parsearPaqueteEquipoTrasfondo,
} from "@/rules/origin-equipment";
import { crearPersonajeVacio } from "@/schemas/character";

const criminalTraits = backgroundMeta.criminal.traits;

describe("parsearPaqueteEquipoTrasfondo", () => {
  it("parsea el paquete A del trasfondo criminal", () => {
    const paquete = parsearPaqueteEquipoTrasfondo(criminalTraits, "A", ORIGIN_CHOICES_EMPTY);
    expect(paquete).not.toBeNull();
    expect(paquete!.gp).toBe(16);
    expect(paquete!.items.some((i) => i.weaponId === "dagger")).toBe(true);
    expect(paquete!.items.some((i) => i.name.includes("Herramientas de ladrón"))).toBe(true);
    expect(paquete!.items.some((i) => i.name === "Palanca")).toBe(true);
  });

  it("parsea el paquete B como oro", () => {
    const paquete = parsearPaqueteEquipoTrasfondo(criminalTraits, "B", ORIGIN_CHOICES_EMPTY);
    expect(paquete).toEqual({ items: [], gp: 50 });
  });

  it("resuelve herramientas de artesano con la elección del jugador", () => {
    const artisanTraits = backgroundMeta.artisan.traits;
    const paquete = parsearPaqueteEquipoTrasfondo(artisanTraits, "A", {
      species: {},
      background: { tool: "smith's tools" },
      class: {},
    });
    expect(paquete!.items.some((i) => i.name.includes("Herramientas de herrero"))).toBe(true);
  });
});

describe("aplicarEquipoTrasfondo", () => {
  it("añade objetos y oro al inventario", () => {
    const base = crearPersonajeVacio({ name: "Ladrona", playerName: "", classId: "rogue" });
    const character = {
      ...base,
      identity: { ...base.identity, backgroundId: "criminal" },
      originChoices: {
        species: {},
        background: { equipment: "A" },
        class: {},
      },
    };
    const result = aplicarEquipoTrasfondo(character);
    expect(result.equipment.currency.gp).toBe(16);
    expect(result.equipment.items.length).toBeGreaterThan(0);
    expect(result.equipment.items.every((i) => i.notes === ORIGIN_BG_EQUIPMENT_NOTE)).toBe(true);
  });

  it("reemplaza el paquete anterior al cambiar de A a B", () => {
    let character = crearPersonajeVacio({ name: "Ladrona", playerName: "", classId: "rogue" });
    character = {
      ...character,
      identity: { ...character.identity, backgroundId: "criminal" },
      originChoices: {
        species: {},
        background: { equipment: "A" },
        class: {},
      },
    };
    character = aplicarEquipoTrasfondo(character);
    const itemsA = character.equipment.items.length;

    character = aplicarEquipoTrasfondo({
      ...character,
      originChoices: {
        ...character.originChoices,
        background: { ...character.originChoices.background, equipment: "B" },
      },
    });
    expect(character.equipment.items.length).toBe(0);
    expect(character.equipment.currency.gp).toBe(50);
    expect(itemsA).toBeGreaterThan(0);
  });
});
