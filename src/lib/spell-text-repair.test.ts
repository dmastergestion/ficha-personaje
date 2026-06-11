import { describe, expect, it } from "vitest";
import { repararTextoConjuroConReferencia } from "@/lib/spell-text-repair";

describe("repararTextoConjuroConReferencia", () => {
  it("rellena dados y pruebas desde texto EN", () => {
    const es =
      "Recibe  de daño por cada 5 pies. Debe superar una prueba de  o  contra tu CD.";
    const en =
      "It takes 2d4 Piercing damage for every 5 feet. A Wisdom (Perception or Survival) check against your";
    const out = repararTextoConjuroConReferencia(es, en);
    expect(out).toContain("2d4 de daño");
    expect(out).toContain("Sabiduría (Percepción o Supervivencia)");
  });

  it("limpia artefactos Foundry", () => {
    const out = repararTextoConjuroConReferencia(
      "Tiene damageresistencia{Resistencia} al daño. No puedes realizar Reaction{Reactions}.",
    );
    expect(out).toContain("Resistencia al daño");
    expect(out).not.toContain("damageresistencia");
    expect(out).toContain("reacciones");
  });
});
