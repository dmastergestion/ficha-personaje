import { PDFDocument, StandardFonts, type PDFFont, type PDFForm, type PDFTextField } from "pdf-lib";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";
import {
  buildOfficialPdfValues,
  calcularCaParaPdf,
  type OfficialPdfValues,
} from "@/pdf/buildOfficialPdfValues";
import { PDF_TEMPLATE_URL } from "@/pdf/official-field-map";
import { tamanoFuenteCampoPdf, tamanoFuenteQueCabe } from "@/pdf/pdfFieldFontSize";

export type PdfFillResult = {
  bytes: Uint8Array;
  missingFields: string[];
};

function rectWidget(field: PDFTextField): { width: number; height: number } {
  const widgets = field.acroField.getWidgets();
  const rect = widgets[0]?.getRectangle();
  return { width: rect?.width ?? 80, height: rect?.height ?? 18 };
}

function fijarTamanoFuente(field: PDFTextField, size: number) {
  try {
    field.setFontSize(size);
  } catch {
    field.acroField.setDefaultAppearance(`/Helv ${size} Tf 0 g`);
  }
}

function marcarCasilla(form: PDFForm, name: string): boolean {
  try {
    form.getCheckBox(name).check();
    return true;
  } catch {
    /* seguir */
  }
  try {
    const field = form.getField(name);
    if (typeof (field as { check?: () => void }).check === "function") {
      (field as { check: () => void }).check();
      return true;
    }
  } catch {
    /* ausente */
  }
  return false;
}

function setCheckField(
  form: PDFForm,
  name: string,
  checked: boolean,
  missing: string[],
) {
  if (!checked) return;
  if (!marcarCasilla(form, name)) missing.push(name);
}

function setTextField(
  form: PDFForm,
  name: string,
  value: string,
  font: PDFFont,
  missing: string[],
) {
  if (!value) return;
  // Nunca tratar casillas (Material / Ritual / Concentración) como texto.
  try {
    form.getCheckBox(name);
    return;
  } catch {
    /* es texto */
  }
  try {
    const field = form.getTextField(name);
    const { width, height } = rectWidget(field);
    const max = tamanoFuenteCampoPdf(name, height);
    const size = tamanoFuenteQueCabe({
      texto: value,
      multilinea: field.isMultiline(),
      anchoWidget: width,
      altoWidget: height,
      max,
      font,
    });
    fijarTamanoFuente(field, size);
    field.setText(value);
  } catch {
    missing.push(name);
  }
}

/** Rellena un PDF ya cargado (útil en tests sin fetch). */
export async function rellenarFormularioPdf(
  pdf: PDFDocument,
  values: OfficialPdfValues,
): Promise<PdfFillResult> {
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const missingFields: string[] = [];

  for (const [name, value] of Object.entries(values.text)) {
    setTextField(form, name, value, font, missingFields);
  }
  // Apariencia de texto antes de casillas, para no regenerar checks con Helvetica.
  form.updateFieldAppearances(font);

  for (const [name, checked] of Object.entries(values.checks)) {
    setCheckField(form, name, checked, missingFields);
  }

  return { bytes: await pdf.save(), missingFields };
}

export async function fillOfficialCharacterPdf(
  character: Character,
  catalog: GameCatalog,
): Promise<PdfFillResult> {
  const response = await fetch(PDF_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(
      "No se encontró la plantilla PDF oficial. Ejecuta: npm run prepare:pdf-template",
    );
  }

  const templateBytes = new Uint8Array(await response.arrayBuffer());
  const pdf = await PDFDocument.load(templateBytes);
  const values = buildOfficialPdfValues(
    character,
    catalog,
    calcularCaParaPdf(character),
  );
  return rellenarFormularioPdf(pdf, values);
}
