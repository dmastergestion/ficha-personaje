import { describe, expect, it, vi, afterEach } from "vitest";
import {
  evaluarImpacto,
  formatearD20,
  formatearToHit,
  parsePartesDaño,
  parseTargetAc,
  tirarAtaqueCompleto,
  tirarDaño,
} from "@/rules/attack-roll";
import { crearPersonajeVacio } from "@/schemas/character";

describe("parsePartesDaño", () => {
  it("parsea 1d8 + MOD FUE + bonificador magico", () => {
    const partes = parsePartesDaño("1d8 + MOD FUE + 2", {
      id: "1",
      name: "Espada",
      abilityKey: "str",
      proficient: true,
      magicBonus: 2,
    });
    expect(partes.dice).toEqual({ count: 1, sides: 8 });
    expect(partes.abilityKey).toBe("str");
    expect(partes.flatBonus).toBe(2);
  });

  it("parsea golpe desarmado", () => {
    const partes = parsePartesDaño("1 + MOD FUE", {
      id: "1",
      name: "Puño",
      abilityKey: "str",
      proficient: true,
    });
    expect(partes.dice).toBeNull();
    expect(partes.flatBase).toBe(1);
  });
});

describe("formatearD20", () => {
  it("muestra ambos dados en ventaja", () => {
    const text = formatearD20({
      mode: "advantage",
      rolls: [12, 18],
      used: 18,
      modifier: 5,
      total: 23,
      isCritical: false,
      isFumble: false,
      source: "virtual",
    });
    expect(text).toBe("d20: 12 y 18 (mayor: 18)");
  });
});

describe("parseTargetAc", () => {
  it("parsea CA válida", () => {
    expect(parseTargetAc("15")).toBe(15);
    expect(parseTargetAc("")).toBeNull();
    expect(parseTargetAc("abc")).toBeNull();
  });
});

describe("formatearToHit", () => {
  it("muestra desglose de atributo y competencia", () => {
    const text = formatearToHit(
      {
        mode: "normal",
        rolls: [18],
        used: 18,
        modifier: 5,
        total: 23,
        isCritical: false,
        isFumble: false,
        source: "virtual",
      },
      {
        abilityMod: 3,
        proficiencyMod: 2,
        magicMod: 0,
        extraToHit: 0,
        extraToHitLabel: null,
        extraDamage: 0,
        extraDamageLabel: null,
        ventajaRabia: false,
        abilityLabel: "fuerza",
      },
    );
    expect(text).toBe("d20: 18 +3 (fuerza) +2 (competencia) = 23");
  });
});

describe("evaluarImpacto", () => {
  it("detecta impacto y fallo", () => {
    const hit = evaluarImpacto(
      {
        mode: "normal",
        rolls: [15],
        used: 15,
        modifier: 5,
        total: 20,
        isCritical: false,
        isFumble: false,
        source: "virtual",
      },
      15,
    );
    expect(hit.impacta).toBe(true);

    const miss = evaluarImpacto(
      {
        mode: "normal",
        rolls: [8],
        used: 8,
        modifier: 5,
        total: 13,
        isCritical: false,
        isFumble: false,
        source: "virtual",
      },
      15,
    );
    expect(miss.impacta).toBe(false);
  });

  it("el texto de crítico usa el d20 real, no siempre 20", () => {
    const crit = evaluarImpacto(
      {
        mode: "normal",
        rolls: [19],
        used: 19,
        modifier: 5,
        total: 24,
        isCritical: true,
        isFumble: false,
        source: "virtual",
      },
      18,
    );
    expect(crit.explicacion).toContain("¡Crítico (19)!");
  });
});

describe("tirarAtaqueCompleto", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("genera ataque y daño con explicación", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const character = crearPersonajeVacio({ name: "A", playerName: "B", classId: "fighter" });
    character.abilities.str = 14;
    character.identity.level = 1;

    const result = tirarAtaqueCompleto(
      character,
      {
        id: "1",
        name: "Espada larga",
        abilityKey: "str",
        proficient: true,
        damage: "1d8 + MOD FUE",
      },
      "normal",
      [],
      0,
      10,
    );
    if ("error" in result) throw new Error(result.error);

    expect(result.explicacionToHit).toContain("d20:");
    expect(result.explicacionToHit).toContain("fuerza");
    expect(result.explicacionToHit).toContain("competencia");
    expect(result.explicacionImpacto).toContain("Impacta");
    expect(result.explicacionDaño).toContain("1d8");
  });

  it("campeón nivel 3 critica con 19 en arma o desarmado", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9); // d20 = 19
    const character = crearPersonajeVacio({ name: "C", playerName: "J", classId: "fighter", level: 3 });
    character.identity.classes = [{ classId: "fighter", subclassId: "champion", level: 3 }];
    character.identity.subclassId = "champion";
    character.abilities.str = 16;
    const result = tirarAtaqueCompleto(
      character,
      {
        id: "1",
        name: "Espada",
        abilityKey: "str",
        proficient: true,
        weaponId: "longsword",
        damage: "1d8 + MOD FUE",
      },
      "normal",
      [],
      0,
      30,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.toHit.used).toBe(19);
    expect(result.toHit.isCritical).toBe(true);
    expect(result.impacta).toBe(true);
  });

  it("un guerrero sin Campeón no critica con 19", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const character = crearPersonajeVacio({ name: "G", playerName: "J", classId: "fighter", level: 3 });
    character.identity.classes = [{ classId: "fighter", subclassId: null, level: 3 }];
    const result = tirarAtaqueCompleto(
      character,
      {
        id: "1",
        name: "Espada",
        abilityKey: "str",
        proficient: true,
        weaponId: "longsword",
        damage: "1d8 + MOD FUE",
      },
      "normal",
      [],
      0,
      30,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.toHit.used).toBe(19);
    expect(result.toHit.isCritical).toBe(false);
    expect(result.impacta).toBe(false);
  });
});

describe("tirarDaño", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("duplica dados en critico", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const dmg = tirarDaño(
      { dice: { count: 1, sides: 8 }, flatBase: 0, abilityKey: "str", flatBonus: 0 },
      2,
      true,
    );
    expect(dmg.rolls).toHaveLength(2);
    expect(dmg.explicacion).toContain("2d8");
  });

  it("etiqueta extras de rabia, no como mágico", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const dmg = tirarDaño(
      { dice: { count: 1, sides: 12 }, flatBase: 0, abilityKey: "str", flatBonus: 0 },
      3,
      false,
      { amount: 2, label: "Rabia +2" },
    );
    expect(dmg.total).toBe(6);
    expect(dmg.explicacion).toContain("Rabia");
    expect(dmg.explicacion).not.toContain("mágico");
  });

  it("el bonus del arma sigue diciendo mágico", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const dmg = tirarDaño(
      { dice: { count: 1, sides: 8 }, flatBase: 0, abilityKey: "str", flatBonus: 1 },
      3,
      false,
    );
    expect(dmg.explicacion).toContain("mágico");
  });
});
