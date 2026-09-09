import { describe, expect, it } from "vitest";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  alternarInvocacion,
  armaPactoElegida,
  AGONIZING_BLAST_CANTRIP_KEY,
  eleccionArmaPacto,
  eleccionesTrucoInvocacion,
  extraDañoAgonizante,
  invocacionesCompletas,
  invocacionesElegibles,
  maxInvocaciones,
  PACT_WEAPON_KEY,
  textoDañoConjuroConInvocaciones,
  trucoAgonizanteElegido,
} from "@/rules/invocations";
import { fusionarEleccionesClase } from "@/rules/class-equipment";

describe("invocations", () => {
  it("tabla 2024 empieza en nivel 1 con una invocación", () => {
    expect(maxInvocaciones(1)).toBe(1);
    expect(maxInvocaciones(2)).toBe(3);
    expect(maxInvocaciones(5)).toBe(5);
  });

  it("nivel 1 solo ofrece invocaciones sin prerrequisito de nivel", () => {
    const ids = invocacionesElegibles(1).map((inv) => inv.id);
    expect(ids).toContain("pact-of-the-tome");
    expect(ids).toContain("armor-of-shadows");
    expect(ids).not.toContain("agonizing-blast");
  });

  it("exige el número de invocaciones del nivel", () => {
    expect(invocacionesCompletas(1, "")).toBe(false);
    expect(invocacionesCompletas(1, "pact-of-the-blade")).toBe(true);
    expect(invocacionesCompletas(2, "pact-of-the-blade")).toBe(false);
  });

  it("alternar no supera el máximo ni ignora prerrequisitos", () => {
    const una = alternarInvocacion(1, "", "pact-of-the-blade");
    expect(una).toBe("pact-of-the-blade");
    expect(alternarInvocacion(1, una, "armor-of-shadows")).toBe("pact-of-the-blade");
    expect(alternarInvocacion(5, "", "thirsting-blade")).toBe("");
    expect(alternarInvocacion(5, "pact-of-the-blade", "thirsting-blade")).toContain(
      "thirsting-blade",
    );
  });

  it("pide el arma de pacto si eliges Pacto de la hoja", () => {
    expect(eleccionArmaPacto("armor-of-shadows")).toHaveLength(0);
    const defs = eleccionArmaPacto("pact-of-the-blade");
    expect(defs).toHaveLength(1);
    expect(defs[0]?.id).toBe(PACT_WEAPON_KEY);
    expect(defs[0]?.options.some((o) => o.value === "rapier")).toBe(true);
    expect(defs[0]?.options.some((o) => o.value === "longbow")).toBe(false);

    const fused = fusionarEleccionesClase("warlock", {
      species: {},
      background: {},
      class: { "eldritch-invocations": "pact-of-the-blade" },
    });
    expect(fused.class[PACT_WEAPON_KEY]).toBe("rapier");
    expect(armaPactoElegida(fused)).toBe("rapier");
    expect(
      armaPactoElegida({
        species: {},
        background: {},
        class: { "eldritch-invocations": "pact-of-the-blade" },
      }),
    ).toBe("rapier");
  });

  it("pide el truco si eliges Descarga agonizante", () => {
    expect(eleccionesTrucoInvocacion("armor-of-shadows")).toHaveLength(0);
    const defs = eleccionesTrucoInvocacion("agonizing-blast");
    expect(defs).toHaveLength(1);
    expect(defs[0]?.id).toBe(AGONIZING_BLAST_CANTRIP_KEY);
    expect(defs[0]?.options.some((o) => o.value === "eldritch-blast")).toBe(true);

    const fused = fusionarEleccionesClase(
      "warlock",
      {
        species: {},
        background: {},
        class: { "eldritch-invocations": "agonizing-blast" },
      },
      { classLevel: 2 },
    );
    expect(fused.class[AGONIZING_BLAST_CANTRIP_KEY]).toBe("eldritch-blast");
    expect(trucoAgonizanteElegido(fused)).toBe("eldritch-blast");
  });

  it("Descarga agonizante suma Carisma al truco elegido o a Descarga arcana por defecto", () => {
    const base = crearPersonajeVacio({ name: "B", playerName: "J", classId: "warlock", level: 2 });
    base.abilities.cha = 16;
    const conDefault = {
      ...base,
      originChoices: {
        species: {},
        background: {},
        class: { "eldritch-invocations": "agonizing-blast" },
      },
    };
    expect(trucoAgonizanteElegido(conDefault.originChoices)).toBe("eldritch-blast");
    expect(extraDañoAgonizante(conDefault, "eldritch-blast")).toBe(3);
    expect(textoDañoConjuroConInvocaciones(conDefault, "eldritch-blast", "1d10")).toBe("1d10+3");
    expect(extraDañoAgonizante(conDefault, "chill-touch")).toBe(0);

    const conEleccion = {
      ...conDefault,
      originChoices: {
        ...conDefault.originChoices,
        class: {
          "eldritch-invocations": "agonizing-blast",
          [AGONIZING_BLAST_CANTRIP_KEY]: "eldritch-blast",
        },
      },
    };
    expect(extraDañoAgonizante(conEleccion, "eldritch-blast")).toBe(3);
  });

  it("prioriza trucos conocidos para Descarga agonizante", () => {
    const defs = eleccionesTrucoInvocacion("agonizing-blast", ["chill-touch"]);
    expect(defs[0]?.options.map((o) => o.value)).toEqual(["chill-touch"]);
    expect(defs[0]?.defaultValue).toBe("chill-touch");
  });
});
