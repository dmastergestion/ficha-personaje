import { describe, expect, it } from "vitest";
import {
  origenDesincronizado,
  sincronizarDotesYPericiasOrigen,
  sincronizarEleccionesOrigen,
} from "@/rules/origin-reapply";
import { crearPersonajeVacio } from "@/schemas/character";

describe("sincronizarEleccionesOrigen", () => {
  it("añade dote de trasfondo y pericia hábil", () => {
    const pj = crearPersonajeVacio({
      name: "H",
      playerName: "J",
      classId: "fighter",
      speciesId: "human",
    });
    pj.identity.backgroundId = "criminal";
    expect(origenDesincronizado(pj)).toBe(true);

    const next = sincronizarEleccionesOrigen(pj, {
      species: { skillful: "perception" },
      background: {},
      class: {},
    });

    expect(next.feats.map((f) => f.id)).toContain("alert");
    expect(next.proficiencies.skills).toContain("perception");
    expect(origenDesincronizado(next)).toBe(false);
  });

  it("añade la dote versátil aunque originChoices no esté persistido", () => {
    const pj = crearPersonajeVacio({
      name: "H",
      playerName: "J",
      classId: "fighter",
      speciesId: "human",
    });
    const fused = {
      species: { skillful: "perception", "versatile-feat": "alert" },
      background: {},
      class: {},
    };
    expect(origenDesincronizado({ ...pj, originChoices: fused })).toBe(true);
    const next = sincronizarDotesYPericiasOrigen(pj, fused);
    expect(next.feats.map((f) => f.id)).toContain("alert");
    expect(next.proficiencies.skills).toContain("perception");
  });
});
