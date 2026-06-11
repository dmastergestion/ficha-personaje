import { describe, expect, it } from "vitest";
import { proficienciasIniciales } from "@/rules/proficiencies";

describe("proficienciasIniciales", () => {
  it("asigna salvaciones de clase", () => {
    const { savingThrows } = proficienciasIniciales("fighter");
    expect(savingThrows).toEqual(["str", "con"]);
  });

  it("añade pericias de trasfondo", () => {
    const { skills } = proficienciasIniciales("wizard", ["arcana", "history"]);
    expect(skills).toEqual(["arcana", "history"]);
  });
});
