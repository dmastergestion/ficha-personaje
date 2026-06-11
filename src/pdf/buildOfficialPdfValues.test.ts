import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/rules/catalog";
import { crearPersonajeVacio } from "@/schemas/character";
import { buildOfficialPdfValues, calcularCaParaPdf } from "@/pdf/buildOfficialPdfValues";
import { spellRowField } from "@/pdf/official-field-map";

describe("buildOfficialPdfValues", () => {
  it("rellena nombre y atributos en campos del PDF oficial", () => {
    const character = crearPersonajeVacio({
      name: "Aria",
      playerName: "Jugador",
      classId: "wizard",
    });
    character.abilities.int = 16;
    character.identity.speciesId = "human";
    const catalog = buildCatalog(null);
    const { text } = buildOfficialPdfValues(
      character,
      catalog,
      calcularCaParaPdf(character),
    );

    expect(text["Nombre de Personaje"]).toBe("Aria");
    expect(text["Inteligencia"]).toBe("16");
    expect(text["Puntuación Inteligencia"]).toBe("+3");
    expect(text["Bonificador por Competencia"]).toBe("+2");
    expect(text["Clase"]).toMatch(/mago/i);
  });

  it("rellena multiclase, conjuros y monedas", () => {
    const character = crearPersonajeVacio({
      name: "Mult",
      playerName: "J",
      classId: "fighter",
    });
    character.identity.classes = [
      { classId: "fighter", subclassId: null, level: 5 },
      { classId: "wizard", subclassId: null, level: 3 },
    ];
    character.identity.level = 8;
    character.spells.cantripsKnown = ["fire-bolt"];
    character.spells.spellsKnown = ["magic-missile"];
    character.spells.abilityKey = "int";
    character.equipment.currency.gp = 42;

    const catalog = buildCatalog(null);
    const { text, checks } = buildOfficialPdfValues(
      character,
      catalog,
      calcularCaParaPdf(character),
    );

    expect(text["Nivel"]).toBe("8");
    expect(text["Clase"]).toMatch(/fighter|guerrero/i);
    expect(text["Clase"]).toMatch(/wizard|mago/i);
    expect(text["CD de Salvación de Conjuros"]).toBeTruthy();
    expect(text["Piezas de Oro"]).toBe("42");
    expect(text[spellRowField(0, "name")]).toMatch(/misil|missile|fuego|fire/i);
    expect(checks["Inspiración Heróica"]).toBe(false);
  });
});
