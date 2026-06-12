import { describe, expect, it } from "vitest";
import { recursosSugeridos } from "@/rules/resources-tracker";
import { crearPersonajeVacio } from "@/schemas/character";

describe("recursosSugeridos", () => {
  it("incluye conocimiento pétreo para enanos", () => {
    const character = crearPersonajeVacio({
      name: "Thorin",
      playerName: "",
      classId: "fighter",
      speciesId: "dwarf",
      level: 3,
    });
    character.identity.classes = [{ classId: "fighter", subclassId: null, level: 3 }];
    const recursos = recursosSugeridos(character);
    const stone = recursos.find((r) => r.id.includes("stonecunning"));
    expect(stone).toBeDefined();
    expect(stone!.name).toBe("Conocimiento pétreo");
    expect(stone!.source).toBe("species");
    expect(stone!.max).toBe(2);
  });

  it("incluye recursos de clase y especie", () => {
    const character = crearPersonajeVacio({
      name: "Guerrero",
      playerName: "",
      classId: "fighter",
      speciesId: "dwarf",
      level: 1,
    });
    character.identity.classes = [{ classId: "fighter", subclassId: null, level: 1 }];
    const recursos = recursosSugeridos(character);
    expect(recursos.some((r) => r.source === "class")).toBe(true);
    expect(recursos.some((r) => r.source === "species")).toBe(true);
  });
});
