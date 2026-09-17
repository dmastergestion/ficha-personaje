import { describe, expect, it } from "vitest";
import {
  cdManiobra,
  dadoSuperioridad,
  maxManiobras,
  MANEUVERS_KEY,
  SUPERIORITY_DICE_ID,
  usarManiobra,
} from "@/rules/battle-master";
import { eleccionesClase, fusionarEleccionesClase } from "@/rules/class-equipment";
import { ORIGIN_CHOICES_EMPTY } from "@/rules/origin-choices";
import { poblarRecursosSugeridos, recursosSugeridos } from "@/rules/resources-tracker";
import { crearPersonajeVacio } from "@/schemas/character";

function maestro(level: number) {
  const base = crearPersonajeVacio({ name: "M", playerName: "J", classId: "fighter", level });
  base.identity.classes = [{ classId: "fighter", subclassId: "battle-master", level }];
  base.identity.subclassId = "battle-master";
  base.abilities.str = 16;
  base.abilities.dex = 12;
  base.originChoices = {
    ...ORIGIN_CHOICES_EMPTY,
    class: { [MANEUVERS_KEY]: "precision-attack,trip-attack,rally" },
  };
  return poblarRecursosSugeridos(base);
}

describe("Maestro de batalla", () => {
  it("escala dados y tamaño según nivel", () => {
    expect(maxManiobras(3)).toBe(3);
    expect(maxManiobras(7)).toBe(5);
    expect(maxManiobras(15)).toBe(9);
    expect(dadoSuperioridad(3)).toBe("d8");
    expect(dadoSuperioridad(10)).toBe("d10");
    expect(dadoSuperioridad(18)).toBe("d12");
  });

  it("sugiere dados de superioridad solo con la subclase", () => {
    const bm = maestro(3);
    expect(recursosSugeridos(bm).some((r) => r.id === SUPERIORITY_DICE_ID)).toBe(true);
    expect(bm.resources.find((r) => r.id === SUPERIORITY_DICE_ID)?.max).toBe(4);

    const champ = crearPersonajeVacio({ name: "C", playerName: "J", classId: "fighter", level: 3 });
    champ.identity.classes = [{ classId: "fighter", subclassId: "champion", level: 3 }];
    expect(recursosSugeridos(champ).some((r) => r.id === SUPERIORITY_DICE_ID)).toBe(false);
  });

  it("gasta un dado, lo tira y calcula la CD", () => {
    const pj = maestro(3);
    expect(cdManiobra(pj)).toBe(8 + 3 + 2);
    const next = usarManiobra(pj, "precision-attack", 7);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.dado).toBe(7);
    expect(next.character.resources.find((r) => r.id === SUPERIORITY_DICE_ID)?.used).toBe(1);
    expect(next.mensaje).toMatch(/precisión/i);
    expect(next.mensaje).toMatch(/CD 13/);
  });

  it("ofrece la elección de maniobras", () => {
    const classes = [{ classId: "fighter" as const, subclassId: "battle-master", level: 3 }];
    expect(eleccionesClase("fighter", { classes }).some((d) => d.id === MANEUVERS_KEY)).toBe(true);
    const fused = fusionarEleccionesClase("fighter", ORIGIN_CHOICES_EMPTY, { classes });
    expect(fused.class[MANEUVERS_KEY]).toBe("");
  });
});
