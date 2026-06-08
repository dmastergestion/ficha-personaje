import { describe, expect, it } from "vitest";
import { proficienciasIniciales } from "@/rules/proficiencies";

describe("proficienciasIniciales", () => {
  it("asigna salvaciones de clase", () => {
    const { savingThrows } = proficienciasIniciales("fighter", null);
    expect(savingThrows).toEqual(["str", "con"]);
  });

  it("añade pericias de trasfondo", () => {
    const { skills } = proficienciasIniciales("wizard", "sage");
    expect(skills).toEqual(["arcana", "history"]);
  });
});
