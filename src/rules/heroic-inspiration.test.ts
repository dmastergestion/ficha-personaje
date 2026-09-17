import { describe, expect, it } from "vitest";
import {
  aplicarInspiracionHeroicaTrasDescanso,
  humanoGanaInspiracionDescansoLargo,
} from "@/rules/heroic-inspiration";
import { crearPersonajeVacio } from "@/schemas/character";

describe("heroic-inspiration", () => {
  it("detecta humano Resourceful", () => {
    expect(humanoGanaInspiracionDescansoLargo("human")).toBe(true);
    expect(humanoGanaInspiracionDescansoLargo("elf-wood")).toBe(false);
  });

  it("no sobrescribe inspiración ya activa", () => {
    const pj = crearPersonajeVacio({ name: "Ana", playerName: "J", classId: "fighter" });
    pj.identity.speciesId = "human";
    pj.combat.inspiration = true;

    const next = aplicarInspiracionHeroicaTrasDescanso(pj, "long");
    expect(next).toBe(pj);
  });
});
