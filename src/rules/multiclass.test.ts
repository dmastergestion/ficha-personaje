import { describe, expect, it } from "vitest";
import {
  agregarClase,
  descripcionClases,
  nivelTotalClases,
  sincronizarIdentidadMulticlase,
  validarClases,
} from "@/rules/multiclass";

describe("multiclass", () => {
  it("calcula nivel total", () => {
    expect(
      nivelTotalClases([
        { classId: "fighter", subclassId: null, level: 5 },
        { classId: "wizard", subclassId: null, level: 3 },
      ]),
    ).toBe(8);
  });

  it("valida suma máxima 20", () => {
    expect(
      validarClases([
        { classId: "fighter", subclassId: null, level: 15 },
        { classId: "wizard", subclassId: null, level: 6 },
      ]),
    ).toMatch(/1 y 20/);
  });

  it("sincroniza clase principal", () => {
    const sync = sincronizarIdentidadMulticlase([
      { classId: "fighter", subclassId: null, level: 3 },
      { classId: "wizard", subclassId: null, level: 7 },
    ]);
    expect(sync.classId).toBe("wizard");
    expect(sync.level).toBe(10);
  });

  it("no permite clases duplicadas al agregar", () => {
    const base = [{ classId: "fighter", subclassId: null, level: 5 }];
    expect(agregarClase(base, "fighter")).toBeNull();
    expect(agregarClase(base, "wizard")).toHaveLength(2);
  });

  it("describe clases para UI", () => {
    expect(
      descripcionClases([{ classId: "fighter", subclassId: null, level: 2 }]),
    ).toContain("2");
  });
});
