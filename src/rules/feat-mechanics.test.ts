import { describe, expect, it } from "vitest";
import {
  conjurosOtorgadosPorDotes,
  eleccionesPorDefectoDote,
  listaIniciadoMagiaDesdeTexto,
  recursosDote,
  tieneCompetenciaIniciativaDote,
} from "@/rules/feat-mechanics";
import { recursosSugeridos } from "@/rules/resources-tracker";
import { iniciativa } from "@/rules/character";
import { crearPersonajeVacio } from "@/schemas/character";

describe("feat-mechanics", () => {
  it("parsea lista de iniciado en la magia desde notas del trasfondo", () => {
    expect(listaIniciadoMagiaDesdeTexto("cleric")).toBe("cleric");
    expect(eleccionesPorDefectoDote("magic-initiate", "cleric")).toEqual({
      "spell-list": "cleric",
      "spell-ability": "wis",
    });
  });

  it("otorga recursos de dote afortunado y alerta en iniciativa", () => {
    const pj = crearPersonajeVacio({ name: "A", playerName: "J", classId: "fighter" });
    pj.feats = [
      { id: "lucky", instanceId: "l1", name: "Afortunado" },
      { id: "alert", instanceId: "a1", name: "Alerta" },
    ];
    pj.abilities.dex = 14;

    expect(tieneCompetenciaIniciativaDote(pj)).toBe(true);
    expect(iniciativa(pj)).toBe(2 + 2);
    const recursos = recursosDote(pj);
    expect(recursos.some((r) => r.id === "feat:l1:luck-points")).toBe(true);
    expect(recursosSugeridos(pj).some((r) => r.source === "feat")).toBe(true);
  });

  it("expone conjuros configurados de iniciado en la magia", () => {
    const pj = crearPersonajeVacio({ name: "A", playerName: "J", classId: "fighter" });
    pj.feats = [
      {
        id: "magic-initiate",
        instanceId: "mi1",
        name: "Iniciado en la magia",
        choices: {
          "spell-list": "wizard",
          "spell-ability": "int",
          "cantrip-1": "fire-bolt",
          "cantrip-2": "mage-hand",
          "spell-1": "shield",
        },
      },
    ];
    const grants = conjurosOtorgadosPorDotes(pj);
    expect(grants).toHaveLength(3);
    expect(grants[0]?.spellId).toBe("fire-bolt");
    expect(grants[2]?.freeResourceId).toBe("feat:mi1:free-cast-1");
  });
});
