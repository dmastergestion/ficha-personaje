import { describe, expect, it } from "vitest";
import {
  contarLineasTextoPdf,
  tamanoFuenteCampoPdf,
  tamanoFuenteQueCabe,
  type PdfFontMetricas,
} from "@/pdf/pdfFieldFontSize";

/** Aproximación monospacio: suficiente para probar el ajuste. */
const fontFake: PdfFontMetricas = {
  widthOfTextAtSize: (text, size) => text.length * size * 0.5,
  heightAtSize: (size) => size,
};

describe("tamanoFuenteCampoPdf", () => {
  it("usa 7 pt en bloques largos aunque el widget sea alto", () => {
    expect(tamanoFuenteCampoPdf("Equipo", 120)).toBe(7);
    expect(tamanoFuenteCampoPdf("Historia y Personalidad", 80)).toBe(7);
  });

  it("limita campos bajos a 8–9 pt", () => {
    expect(tamanoFuenteCampoPdf("Nombre", 14)).toBe(8);
    expect(tamanoFuenteCampoPdf("Clase", 18)).toBe(9);
  });

  it("nunca supera 10 pt (evita auto-size ilegible de pdf-lib)", () => {
    expect(tamanoFuenteCampoPdf("CA", 40)).toBe(10);
    expect(tamanoFuenteCampoPdf("Puntuación Fuerza", 40)).toBe(9);
  });
});

describe("tamanoFuenteQueCabe", () => {
  it("mantiene el máximo si el texto es corto", () => {
    expect(
      tamanoFuenteQueCabe({
        texto: "12",
        multilinea: false,
        anchoWidget: 40,
        altoWidget: 18,
        max: 10,
        font: fontFake,
      }),
    ).toBe(10);
  });

  it("reduce la fuente en una línea larga", () => {
    const size = tamanoFuenteQueCabe({
      texto: "Nombre muy muy muy largo del personaje",
      multilinea: false,
      anchoWidget: 80,
      altoWidget: 16,
      max: 10,
      font: fontFake,
    });
    expect(size).toBeLessThan(10);
    expect(size).toBeGreaterThanOrEqual(4);
  });

  it("reduce en multilínea cuando hay muchas líneas", () => {
    const texto = Array.from({ length: 40 }, (_, i) => `Ítem de equipo número ${i + 1}`).join("\n");
    const size = tamanoFuenteQueCabe({
      texto,
      multilinea: true,
      anchoWidget: 200,
      altoWidget: 100,
      max: 7,
      font: fontFake,
    });
    expect(size).toBeLessThan(7);
    expect(size).toBeGreaterThanOrEqual(4);
  });

  it("contarLineasTextoPdf hace wrap por ancho", () => {
    expect(contarLineasTextoPdf("hola mundo", fontFake, 100, 10)).toBe(1);
    expect(contarLineasTextoPdf("hola mundo", fontFake, 20, 10)).toBeGreaterThan(1);
  });
});
