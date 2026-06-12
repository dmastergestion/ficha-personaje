import { describe, expect, it } from "vitest";
import { alcanceVisionOscuraDesdeTraits } from "@/rules/sensory";

describe("sensory", () => {
  it("parsea visión en la oscuridad en inglés", () => {
    const traits =
      "Darkvision: You have Darkvision with a range of 120 feet.\n\nOther trait";
    expect(alcanceVisionOscuraDesdeTraits(traits)).toBe(120);
  });

  it("parsea visión en la oscuridad en español", () => {
    const traits = "Visión en la oscuridad. Tienes visión en la oscuridad con un alcance de 60 pies (18 m).";
    expect(alcanceVisionOscuraDesdeTraits(traits)).toBe(60);
  });
});
