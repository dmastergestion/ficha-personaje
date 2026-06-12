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

  it("otorga inspiración al humano tras descanso largo", () => {
    const pj = crearPersonajeVacio({ name: "Ana", playerName: "J", classId: "fighter" });
    pj.identity.speciesId = "human";
    pj.combat.inspiration = false;

    const next = aplicarInspiracionHeroicaTrasDescanso(pj, "long");
    expect(next.combat.inspiration).toBe(true);
  });

  it("otorga inspiración al músico tras descanso corto", () => {
    const pj = crearPersonajeVacio({ name: "Bardo", playerName: "J", classId: "bard" });
    pj.identity.speciesId = "elf-high";
    pj.feats = [{ id: "musician", name: "Músico" }];
    pj.combat.inspiration = false;

    const next = aplicarInspiracionHeroicaTrasDescanso(pj, "short");
    expect(next.combat.inspiration).toBe(true);
  });

  it("no sobrescribe inspiración ya activa", () => {
    const pj = crearPersonajeVacio({ name: "Ana", playerName: "J", classId: "fighter" });
    pj.identity.speciesId = "human";
    pj.combat.inspiration = true;

    const next = aplicarInspiracionHeroicaTrasDescanso(pj, "long");
    expect(next).toBe(pj);
  });
});
