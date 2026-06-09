import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  ajustarRecurso,
  aplicarRecargaRecursos,
  maxRecursoClase,
  recursosSugeridos,
} from "@/rules/resources-tracker";

describe("resources-tracker", () => {
  it("calcula rabia del bárbaro por nivel", () => {
    expect(maxRecursoClase("barbarian", "rage", 1)).toBe(2);
    expect(maxRecursoClase("barbarian", "rage", 6)).toBe(4);
  });

  it("sugiere recursos según clases", () => {
    const character = crearPersonajeVacio({ name: "T", playerName: "J", classId: "barbarian" });
    const sugeridos = recursosSugeridos(character.identity.classes);
    expect(sugeridos.some((r) => r.id.includes("rage"))).toBe(true);
  });

  it("recarga recursos en descanso largo", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    const withResources = {
      ...base,
      resources: [
        {
          id: "fighter:second-wind",
          name: "Segundo aliento",
          max: 2,
          used: 2,
          recharge: "short" as const,
        },
        {
          id: "fighter:action-surge",
          name: "Oleada",
          max: 1,
          used: 1,
          recharge: "long" as const,
        },
      ],
    };
    const short = aplicarRecargaRecursos(withResources, "short");
    expect(short.resources.find((r) => r.id === "fighter:second-wind")?.used).toBe(0);
    expect(short.resources.find((r) => r.id === "fighter:action-surge")?.used).toBe(1);

    const long = aplicarRecargaRecursos(withResources, "long");
    expect(long.resources.every((r) => r.used === 0)).toBe(true);
  });

  it("ajusta usos sin pasar del máximo", () => {
    const base = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    const character = {
      ...base,
      resources: [{ id: "x", name: "X", max: 2, used: 0, recharge: "long" as const }],
    };
    const spent = ajustarRecurso(character, "x", 1);
    expect(spent.resources[0]?.used).toBe(1);
    const over = ajustarRecurso(spent, "x", 5);
    expect(over.resources[0]?.used).toBe(2);
  });
});
