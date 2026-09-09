import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import { descripcionConjuro } from "@/rules/spell-text";
import {
  aplicarUpcastEnDescripcion,
  descripcionConjuroMostrada,
  proyectilesConjuro,
} from "@/rules/spell-upcast-text";

describe("proyectilesConjuro", () => {
  it("proyectil mágico suma un dardo por nivel de espacio", () => {
    expect(proyectilesConjuro("magic-missile", 1, 1, 1)).toBe(3);
    expect(proyectilesConjuro("magic-missile", 1, 3, 5)).toBe(5);
  });

  it("rayo abrasador suma un rayo por nivel por encima de 2", () => {
    expect(proyectilesConjuro("scorching-ray", 2, 2, 3)).toBe(3);
    expect(proyectilesConjuro("scorching-ray", 2, 3, 5)).toBe(4);
  });

  it("descarga sobrenatural escala con el nivel de personaje", () => {
    expect(proyectilesConjuro("eldritch-blast", 0, 0, 1)).toBe(1);
    expect(proyectilesConjuro("eldritch-blast", 0, 0, 5)).toBe(2);
    expect(proyectilesConjuro("eldritch-blast", 0, 0, 11)).toBe(3);
  });
});

describe("aplicarUpcastEnDescripcion", () => {
  it("manos ardientes a pacto 3 usa 5d6 y omite el párrafo de upcast", () => {
    const base = descripcionConjuro("burning-hands")!;
    const text = aplicarUpcastEnDescripcion(base, {
      spellId: "burning-hands",
      nivelBase: 1,
      nivelRanura: 3,
      nivelPersonaje: 5,
      damage: { dice: "3d6", type: "fuego", scalePerSlot: "1d6" },
    });
    expect(text).toContain("5d6");
    expect(text).not.toContain("3d6");
    expect(text).not.toMatch(/espacio de conjuro de nivel superior/i);
  });

  it("proyectil mágico a pacto 3 crea cinco dardos", () => {
    const base = descripcionConjuro("magic-missile")!;
    const text = aplicarUpcastEnDescripcion(base, {
      spellId: "magic-missile",
      nivelBase: 1,
      nivelRanura: 3,
      nivelPersonaje: 5,
    });
    expect(text).toMatch(/cinco dardos/i);
    expect(text).not.toMatch(/tres dardos/i);
    expect(text).not.toMatch(/espacio de conjuro de nivel superior/i);
    expect(text).not.toMatch(/\{Level/);
  });

  it("rayo abrasador a pacto 3 lanza cuatro rayos", () => {
    const base = descripcionConjuro("scorching-ray")!;
    const text = aplicarUpcastEnDescripcion(base, {
      spellId: "scorching-ray",
      nivelBase: 2,
      nivelRanura: 3,
      nivelPersonaje: 5,
    });
    expect(text).toMatch(/cuatro rayos/i);
    expect(text).not.toMatch(/tres rayos/i);
  });
});

describe("descripcionConjuroMostrada", () => {
  it("brujo ve el texto ya a nivel de pacto; mago conserva el upcast", () => {
    const brujo = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 5 });
    const mago = crearPersonajeVacio({ name: "M", playerName: "J", classId: "wizard", level: 5 });
    const base = descripcionConjuro("burning-hands")!;
    const comoBrujo = descripcionConjuroMostrada(brujo, "burning-hands", base, {
      dice: "3d6",
      scalePerSlot: "1d6",
    });
    const comoMago = descripcionConjuroMostrada(mago, "burning-hands", base, {
      dice: "3d6",
      scalePerSlot: "1d6",
    });
    expect(comoBrujo).toContain("5d6");
    expect(comoMago).toContain("3d6");
    expect(comoMago).toMatch(/nivel superior/i);
  });

  it("descarga sobrenatural a nivel 5 habla de dos rayos", () => {
    const brujo = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 5 });
    const text = descripcionConjuroMostrada(brujo, "eldritch-blast", descripcionConjuro("eldritch-blast"));
    expect(text).toMatch(/dos rayos/i);
    expect(text).not.toMatch(/Mejora de truco/i);
  });
});
