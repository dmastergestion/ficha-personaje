import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/rules/catalog";
import { crearPersonajeVacio } from "@/schemas/character";
import {
  buildOfficialPdfValues,
  calcularCaParaPdf,
  filasArmasYTrucosPdf,
} from "@/pdf/buildOfficialPdfValues";
import { attackRowField, spellRowField } from "@/pdf/official-field-map";

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

  it("pone armas y trucos de ataque en Armas y trucos; hechizos en la lista de conjuros", () => {
    const character = crearPersonajeVacio({
      name: "Brujo",
      playerName: "J",
      classId: "warlock",
      level: 5,
    });
    character.abilities.cha = 16;
    character.spells.abilityKey = "cha";
    character.spells.cantripsKnown = ["eldritch-blast", "prestidigitation"];
    character.spells.spellsPrepared = ["hex", "guiding-bolt"];
    character.equipment.items = [
      {
        id: "espada",
        name: "Espada corta",
        qty: 1,
        weightLb: 2,
        notes: "",
        weaponId: "shortsword",
        inCombat: true,
      },
    ];

    const catalog = buildCatalog(null);
    const filas = filasArmasYTrucosPdf(character, catalog);
    expect(filas.some((f) => /espada|shortsword/i.test(f.name))).toBe(true);
    expect(filas.some((f) => /descarga|eldritch/i.test(f.name))).toBe(true);
    expect(filas.some((f) => /guía|guid|guiding/i.test(f.name))).toBe(true);
    expect(filas.every((f) => !/prestidigit/i.test(f.name))).toBe(true);

    const { text } = buildOfficialPdfValues(character, catalog, calcularCaParaPdf(character));
    expect(text[attackRowField(0, "name")]).toBeTruthy();
    const nombresHechizos = [0, 1, 2, 3]
      .map((i) => text[spellRowField(i, "name")] ?? "")
      .join(" ");
    expect(nombresHechizos).toMatch(/descarga|eldritch|prestidigit|hex|guía|guid/i);
    expect(nombresHechizos).not.toMatch(/espada/i);

    const { text: textPdf, checks } = buildOfficialPdfValues(
      character,
      catalog,
      calcularCaParaPdf(character),
    );
    const materiales = Object.keys(checks).filter((k) => k.startsWith("Material Necesario"));
    expect(materiales.length).toBeGreaterThan(0);
    expect(Object.keys(textPdf).some((k) => k.startsWith("Material Necesario"))).toBe(false);
  });
});
