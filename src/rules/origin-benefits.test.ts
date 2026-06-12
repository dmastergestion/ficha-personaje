import { describe, expect, it } from "vitest";
import backgroundMeta from "@/data/srd/background-meta.json";
import {
  aplicarBonificadoresAtributo,
  bonificadoresAtributoTrasfondo,
  calcularBeneficiosOrigen,
  normalizarPericia,
} from "@/rules/origin-benefits";

describe("normalizarPericia", () => {
  it("convierte sleight of hand", () => {
    expect(normalizarPericia("sleight of hand")).toBe("sleightOfHand");
  });

  it("ignora líneas de elección", () => {
    expect(normalizarPericia("Elegir: insight, perception, survival")).toBeNull();
  });
});

describe("calcularBeneficiosOrigen", () => {
  it("aplica pericias, herramientas y dote del trasfondo criminal", () => {
    const b = calcularBeneficiosOrigen("human", "criminal", 1);
    expect(b.skills).toEqual(["sleightOfHand", "stealth"]);
    expect(b.toolProficiencies).toContain("thieves' tools");
    expect(b.feat?.id).toBe("alert");
    expect(b.speciesFeat).toBeNull();
  });

  it("aplica dote versátil del humano", () => {
    const b = calcularBeneficiosOrigen(
      "human",
      "criminal",
      1,
      undefined,
      { species: { "versatile-feat": "lucky", skillful: "perception" }, background: {}, class: {} },
    );
    expect(b.speciesFeat?.id).toBe("lucky");
  });

  it("aplica bonificadores de atributo del trasfondo sabio", () => {
    const traits = backgroundTraits("sage");
    const bonuses = bonificadoresAtributoTrasfondo(traits);
    expect(bonuses).toEqual({ con: 2, int: 1, wis: 1 });

    const abilities = aplicarBonificadoresAtributo(
      { str: 10, dex: 10, con: 10, int: 15, wis: 10, cha: 10 },
      bonuses,
    );
    expect(abilities.con).toBe(12);
    expect(abilities.int).toBe(16);
    expect(abilities.wis).toBe(11);
  });

  it("suma PV extra de enano", () => {
    const b = calcularBeneficiosOrigen("dwarf", null, 3);
    expect(b.hpBonusTotal).toBe(3);
  });

  it("usa datos del catálogo PHB para trasfondos fuera del SRD", () => {
    const traits =
      "Ability Scores:: Strength, Intelligence, Charisma Feat:: Skilled Skill Proficiencies:: History, Persuasion";
    const b = calcularBeneficiosOrigen(
      "human",
      "noble",
      1,
      {
        background: {
          skillProficiencies: ["history", "persuasion"],
          toolProficiencies: ["gaming set"],
          feat: "Skilled",
          traits,
        },
      },
      {
        species: {},
        background: { "ability-mode": "split", "ability-plus-2": "str", "ability-plus-1": "int" },
        class: {},
      },
    );
    expect(b.skills).toEqual(["history", "persuasion"]);
    expect(b.feat?.id).toBe("skilled");
    expect(b.abilityBonuses).toEqual({ str: 2, int: 1 });
  });
});

function backgroundTraits(id: string): string | undefined {
  return (backgroundMeta as Record<string, { traits?: string }>)[id]?.traits;
}
