import { PDFDocument } from "pdf-lib";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";
import {
  buildOfficialPdfValues,
  calcularCaParaPdf,
} from "@/pdf/buildOfficialPdfValues";
import { PDF_TEMPLATE_URL } from "@/pdf/official-field-map";

function setTextField(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  if (!value) return;
  try {
    form.getTextField(name).setText(value);
  } catch {
    // Campo ausente o tipo distinto en variantes del PDF.
  }
}

function setCheckField(form: ReturnType<PDFDocument["getForm"]>, name: string, checked: boolean) {
  if (!checked) return;
  try {
    form.getCheckBox(name).check();
  } catch {
    try {
      const field = form.getField(name);
      if ("check" in field && typeof field.check === "function") field.check();
    } catch {
      // ignorar
    }
  }
}

export async function fillOfficialCharacterPdf(
  character: Character,
  catalog: GameCatalog,
): Promise<Uint8Array> {
  const response = await fetch(PDF_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(
      "No se encontró la plantilla PDF oficial. Ejecuta: npm run prepare:pdf-template",
    );
  }

  const templateBytes = new Uint8Array(await response.arrayBuffer());
  const pdf = await PDFDocument.load(templateBytes);
  const form = pdf.getForm();
  const armorClass = calcularCaParaPdf(character);
  const { text, checks } = buildOfficialPdfValues(character, catalog, armorClass);

  for (const [name, value] of Object.entries(text)) {
    setTextField(form, name, value);
  }
  for (const [name, checked] of Object.entries(checks)) {
    setCheckField(form, name, checked);
  }

  form.updateFieldAppearances();
  return pdf.save();
}
