import { describe, expect, it } from "vitest";
import { attackRowField, spellRowField } from "@/pdf/official-field-map";

describe("official-field-map", () => {
  it("Armas y trucos usa Nombre/Notas con un espacio", () => {
    expect(attackRowField(0, "name")).toBe("Nombre - Fila 1");
    expect(attackRowField(0, "notes")).toBe("Notas - Fila 1");
    expect(attackRowField(0, "bonus")).toBe("Bonificacion Ataque/CD - Fila 1");
  });

  it("Conjuros 1–6 usan Nombre/Notas con dos espacios", () => {
    expect(spellRowField(0, "name")).toBe("Nombre -  Fila 1");
    expect(spellRowField(0, "notes")).toBe("Notas -  Fila 1");
    expect(spellRowField(0, "level")).toBe("Nivel - Fila 1");
  });

  it("Conjuros 7+ usan un espacio en Nombre/Notas", () => {
    expect(spellRowField(6, "name")).toBe("Nombre - Fila 7");
    expect(spellRowField(6, "notes")).toBe("Notas - Fila 7");
  });
});
