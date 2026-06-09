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
});

describe("tirarDaño", () => {
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
});
