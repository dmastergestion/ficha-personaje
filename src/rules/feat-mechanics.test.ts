import { describe, expect, it } from "vitest";
import {
  actualizarEleccionDote,
  conjurosOtorgadosPorDotes,
  doteConfigCompleta,
  doteCumplePrerrequisitos,
  eleccionesDote,
  eleccionesPorDefectoDote,
  listaIniciadoMagiaDesdeTexto,
  periciasOcupadasFueraDeDote,
  recursosDote,
  tieneCompetenciaIniciativaDote,
} from "@/rules/feat-mechanics";
import { recursosSugeridos } from "@/rules/resources-tracker";
import { esProficientePericia, iniciativa } from "@/rules/character";
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

  it("no ofrece una pericia ya obtenida en otro punto", () => {
    const pj = crearPersonajeVacio({ name: "A", playerName: "J", classId: "fighter" });
    pj.proficiencies.skills = ["insight", "religion"];
    pj.feats = [
      {
        id: "skilled",
        instanceId: "sk1",
        name: "Hábil",
        choices: { "skill-1": "athletics" },
      },
    ];
    const defs = eleccionesDote(pj.feats[0]!, [], {
      occupiedSkills: periciasOcupadasFueraDeDote(pj, "sk1"),
    });
    const skill2 = defs.find((d) => d.id === "skill-2")!;
    expect(skill2.options.some((o) => o.value === "insight")).toBe(false);
    expect(skill2.options.some((o) => o.value === "athletics")).toBe(false);
    expect(skill2.options.some((o) => o.value === "perception")).toBe(true);
  });

  it("no acepta trucos duplicados en iniciado en la magia", () => {
    const duplicado = {
      id: "magic-initiate",
      instanceId: "mi1",
      name: "Iniciado en la magia",
      choices: {
        "spell-list": "wizard",
        "spell-ability": "int",
        "cantrip-1": "fire-bolt",
        "cantrip-2": "fire-bolt",
        "spell-1": "shield",
      },
    };
    expect(doteConfigCompleta(duplicado)).toBe(false);

    const feat = {
      ...duplicado,
      choices: { ...duplicado.choices, "cantrip-2": "mage-hand" },
    };
    const defs = eleccionesDote(feat, [
      { id: "fire-bolt", level: 0, name: "Rayo de fuego" },
      { id: "mage-hand", level: 0, name: "Mano de mago" },
    ]);
    const truco2 = defs.find((d) => d.id === "cantrip-2")!;
    expect(truco2.options.some((o) => o.value === "fire-bolt")).toBe(false);
    expect(truco2.options.some((o) => o.value === "mage-hand")).toBe(true);
  });
});

describe("doteCumplePrerrequisitos", () => {
  it("bloquea dote general a nivel 1", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    const r = doteCumplePrerrequisitos(pj, "athlete");
    expect(r.ok).toBe(false);
    expect(r.razones.join(" ")).toMatch(/nivel 4/i);
  });

  it("bloquea estilo de combate sin el rasgo", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "wizard" });
    const r = doteCumplePrerrequisitos(pj, "archery");
    expect(r.ok).toBe(false);
    expect(r.razones.join(" ")).toMatch(/estilo/i);
  });

  it("permite estilo de combate al guerrero", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    expect(doteCumplePrerrequisitos(pj, "archery").ok).toBe(true);
  });

  it("bloquea Actor si el Carisma es menor de 13", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "bard" });
    pj.identity.level = 4;
    pj.identity.classes = [{ classId: "bard", subclassId: null, level: 4 }];
    pj.abilities.cha = 12;
    const r = doteCumplePrerrequisitos(pj, "actor");
    expect(r.ok).toBe(false);
    expect(r.razones.join(" ")).toMatch(/Carisma 13/i);
    pj.abilities.cha = 13;
    expect(doteCumplePrerrequisitos(pj, "actor").ok).toBe(true);
  });

  it("sincroniza pericias de Hábil al elegir", () => {
    const pj = crearPersonajeVacio({ name: "T", playerName: "J", classId: "fighter" });
    pj.feats = [{ id: "skilled", instanceId: "sk1", name: "Hábil" }];
    const next = actualizarEleccionDote(pj, "sk1", "skill-1", "stealth");
    expect(esProficientePericia(next, "stealth")).toBe(true);
    const next2 = actualizarEleccionDote(next, "sk1", "skill-1", "perception");
    expect(esProficientePericia(next2, "perception")).toBe(true);
    expect(esProficientePericia(next2, "stealth")).toBe(false);
  });
});
