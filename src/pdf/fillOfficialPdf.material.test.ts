import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildCatalog } from "@/rules/catalog";
import { crearPersonajeVacio } from "@/schemas/character";
import { buildOfficialPdfValues, calcularCaParaPdf } from "@/pdf/buildOfficialPdfValues";
import { rellenarFormularioPdf } from "@/pdf/fillOfficialPdf";

describe("rellenarFormularioPdf material", () => {
  it("marca Material Necesario como casilla y no lo reporta como faltante", async () => {
    const templatePath = resolve(process.cwd(), "public/pdf/pj2024-template.pdf");
    const pdf = await PDFDocument.load(readFileSync(templatePath));
    const character = crearPersonajeVacio({
      name: "Test",
      playerName: "J",
      classId: "warlock",
      level: 3,
    });
    character.spells.abilityKey = "cha";
    character.spells.cantripsKnown = ["eldritch-blast"];
    character.spells.spellsPrepared = ["hex", "armor-of-agathys"];
    const catalog = buildCatalog(null);
    const values = buildOfficialPdfValues(character, catalog, calcularCaParaPdf(character));

    const materialKeys = Object.keys(values.checks).filter((k) =>
      k.startsWith("Material Necesario"),
    );
    expect(materialKeys.length).toBeGreaterThan(0);
    expect(Object.keys(values.text).some((k) => k.startsWith("Material Necesario"))).toBe(
      false,
    );

    const { missingFields } = await rellenarFormularioPdf(pdf, values);
    expect(missingFields.filter((n) => n.startsWith("Material Necesario"))).toEqual([]);

    for (const key of materialKeys) {
      expect(pdf.getForm().getCheckBox(key).isChecked()).toBe(true);
    }
  });
});
