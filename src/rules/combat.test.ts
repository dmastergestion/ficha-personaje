import { describe, expect, it } from "vitest";
import { calcularClaseArmadura, desgloseClaseArmadura } from "@/rules/combat";
import type { SrdArmor } from "@/rules/srd";

const leather: SrdArmor = {
  id: "leather-armor",
  srdId: "phbarmLeatherArm",
  nameEn: "Leather Armor",
  category: "light",
  baseAc: 11,
  dexMax: null,
  strengthMin: null,
};

const chainMail: SrdArmor = {
  id: "chain-mail",
  srdId: "phbarmChainMail0",
  nameEn: "Chain Mail",
  category: "heavy",
  baseAc: 16,
  dexMax: null,
  strengthMin: 13,
};

const shield: SrdArmor = {
  id: "shield",
  srdId: "phbarmShield0000",
  nameEn: "Shield",
  category: "shield",
  baseAc: 2,
  dexMax: null,
  strengthMin: null,
};

describe("calcularClaseArmadura", () => {
  it("usa override manual", () => {
    expect(calcularClaseArmadura(10, null, false, shield, 18)).toBe(18);
  });

  it("calcula armadura ligera + destreza", () => {
    expect(calcularClaseArmadura(16, leather, false, shield, null)).toBe(14);
  });

  it("calcula armadura pesada sin destreza", () => {
    expect(calcularClaseArmadura(16, chainMail, false, shield, null)).toBe(16);
  });

  it("suma escudo", () => {
    expect(calcularClaseArmadura(16, chainMail, true, shield, null)).toBe(18);
  });
});

describe("desgloseClaseArmadura", () => {
  it("sin armadura muestra base y DES", () => {
    const d = desgloseClaseArmadura(14, null, false, shield, null);
    expect(d.total).toBe(12);
    expect(d.resumen).toBe("Arm 10 + DES +2");
  });

  it("armadura pesada y escudo", () => {
    const d = desgloseClaseArmadura(16, chainMail, true, shield, null, {
      etiquetaArmadura: "Cota",
    });
    expect(d.total).toBe(18);
    expect(d.resumen).toBe("Cota 16 + Esc 2");
  });

  it("override manual", () => {
    const d = desgloseClaseArmadura(10, null, false, shield, 18);
    expect(d.resumen).toBe("Manual 18");
  });
});
