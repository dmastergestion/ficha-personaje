import { describe, expect, it } from "vitest";
import {
  bestiasElegibles,
  catalogoBestias,
  formasSalvajeCompletas,
  fusionarFormasSalvaje,
  limitesFormaSalvaje,
  parsearFormasSalvaje,
  activarFormaSalvaje,
  desactivarFormaSalvaje,
  atributosEfectivos,
  tieneBloqueCombate,
  WILD_SHAPE_RESOURCE_ID,
} from "@/rules/wild-shape";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { crearPersonajeVacio } from "@/schemas/character";

describe("wild-shape", () => {
  it("aplica tabla SRD 2024 por nivel", () => {
    expect(limitesFormaSalvaje(1)).toBeNull();
    expect(limitesFormaSalvaje(2)).toEqual({ maxFormas: 4, maxCr: 0.25, permiteVuelo: false });
    expect(limitesFormaSalvaje(5)).toEqual({ maxFormas: 6, maxCr: 0.5, permiteVuelo: false });
    expect(limitesFormaSalvaje(8)).toEqual({ maxFormas: 8, maxCr: 1, permiteVuelo: true });
  });

  it("excluye vuelo antes de nivel 8", () => {
    const nivel4 = bestiasElegibles(4);
    expect(nivel4.some((b) => b.id === "wolf")).toBe(true);
    expect(nivel4.some((b) => b.id === "giant-eagle")).toBe(false);
    const nivel8 = bestiasElegibles(8);
    expect(nivel8.some((b) => b.id === "giant-eagle")).toBe(true);
  });

  it("el simio pasa a ID 1/2 en SRD 2024 y no es legal a nivel 2", () => {
    expect(bestiasElegibles(2).some((b) => b.id === "ape")).toBe(false);
    expect(bestiasElegibles(4).some((b) => b.id === "ape")).toBe(true);
  });

  it("todas las bestias del catálogo salvo estirge tienen bloque SRD 5.2.1", () => {
    const sinBloque = catalogoBestias().filter((b) => !tieneBloqueCombate(b)).map((b) => b.id);
    expect(sinBloque).toEqual(["stirge"]);
  });

  it("asigna formas recomendadas si no hay elección", () => {
    const forms = parsearFormasSalvaje(fusionarFormasSalvaje(2, undefined));
    expect(forms).toEqual(["rat", "riding-horse", "spider", "wolf"]);
  });

  it("requiere el número exacto de formas conocidas", () => {
    expect(formasSalvajeCompletas(2, "rat,wolf,spider")).toBe(false);
    expect(formasSalvajeCompletas(2, "rat,wolf,spider,riding-horse")).toBe(true);
  });

  it("al activar lobo gasta un uso, da PG temp y sustituye FUE/DES/CON", () => {
    const base = crearPersonajeVacio({
      name: "Dru",
      playerName: "J",
      classId: "druid",
      level: 2,
    });
    base.identity.classes = [{ classId: "druid", subclassId: null, level: 2 }];
    base.originChoices = {
      ...base.originChoices,
      class: { "wild-shape-forms": "rat,riding-horse,spider,wolf" },
    };
    const pj = poblarRecursosSugeridos(base);
    const next = activarFormaSalvaje(pj, "wolf");
    expect("error" in next).toBe(false);
    if ("error" in next) return;
    expect(next.combat.wildShapeBeastId).toBe("wolf");
    expect(next.combat.hpTemp).toBe(2);
    expect(next.resources.find((r) => r.id === WILD_SHAPE_RESOURCE_ID)?.used).toBe(1);
    expect(atributosEfectivos(next).str).toBe(14);
    expect(atributosEfectivos(next).dex).toBe(15);
    expect(desactivarFormaSalvaje(next).combat.wildShapeBeastId).toBeNull();
  });

  it("no activa si no quedan usos", () => {
    const base = crearPersonajeVacio({
      name: "Dru",
      playerName: "J",
      classId: "druid",
      level: 2,
    });
    base.identity.classes = [{ classId: "druid", subclassId: null, level: 2 }];
    base.originChoices = {
      ...base.originChoices,
      class: { "wild-shape-forms": "rat,riding-horse,spider,wolf" },
    };
    const pj = poblarRecursosSugeridos(base);
    pj.resources = pj.resources.map((r) =>
      r.id === WILD_SHAPE_RESOURCE_ID ? { ...r, used: r.max } : r,
    );
    const next = activarFormaSalvaje(pj, "wolf");
    expect(next).toEqual({ error: "No te quedan usos de Forma salvaje." });
  });
});
