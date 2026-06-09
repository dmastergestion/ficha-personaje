import { describe, expect, it } from "vitest";
import { descripcionDote, limpiarTextoDote } from "@/rules/feat-text";

describe("descripcionDote", () => {
  it("devuelve mercader en español", () => {
    const text = descripcionDote("merchant");
    expect(text).toContain("Persuasión mercantil");
  });

  it("devuelve artesano aunque no tenga descriptionEs en meta", () => {
    const text = descripcionDote("crafter");
    expect(text).toContain("Descuento");
  });
});

describe("limpiarTextoDote", () => {
  it("quita marcadores XPHB", () => {
    expect(limpiarTextoDote("Roll XPHB|Proficiency Bonus")).toContain("bonificador de competencia");
  });
});
