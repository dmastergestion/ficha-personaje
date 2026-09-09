/** Métricas mínimas de una fuente pdf-lib (p. ej. Helvetica embebida). */
export type PdfFontMetricas = {
  widthOfTextAtSize(text: string, size: number): number;
  heightAtSize(size: number, options?: { descender?: boolean }): number;
};

const TAMANO_MIN = 4;
/** Márgen interno aproximado al de pdf-lib (borde + padding). */
const MARGEN_INTERNO = 2;

/** Tamaño máximo de fuente AcroForm según tipo de campo (evita texto gigante con poco contenido). */
export function tamanoFuenteCampoPdf(nombre: string, alturaWidget: number): number {
  const bloquesLargos = new Set([
    "Atributos de Especie",
    "Equipo",
    "Aspecto",
    "Historia y Personalidad",
    "Dotes",
    "Rasgos de Clase A",
    "Rasgos de Clase B",
    "Armas",
    "Herramientas",
    "Idiomas",
  ]);
  if (bloquesLargos.has(nombre)) return 7;
  if (nombre.includes("Fila") || nombre.startsWith("Notas")) return 8;
  if (
    nombre.startsWith("Puntuación") ||
    nombre.startsWith("Valor -") ||
    nombre.startsWith("Tirada de Salvación -")
  ) {
    return 9;
  }
  if (alturaWidget <= 17) return 8;
  if (alturaWidget <= 20) return 9;
  return 10;
}

/** Cuenta líneas tras wrap por ancho (misma heurística que pdf-lib). */
export function contarLineasTextoPdf(
  texto: string,
  font: PdfFontMetricas,
  ancho: number,
  fontSize: number,
): number {
  const limpio = texto.replace(/\t|\v|\f/g, " ").replace(/\r\n?/g, "\n");
  const paragrafos = limpio.length === 0 ? [""] : limpio.split("\n");
  let lineas = 0;
  for (const paragrafo of paragrafos) {
    lineas += 1;
    const words = paragrafo.split(" ");
    let restante = ancho;
    for (let i = 0; i < words.length; i++) {
      const ultimo = i === words.length - 1;
      const palabra = ultimo ? words[i]! : `${words[i]!} `;
      const w = font.widthOfTextAtSize(palabra, fontSize);
      restante -= w;
      if (restante <= 0) {
        lineas += 1;
        restante = ancho - w;
      }
    }
  }
  return Math.max(1, lineas);
}

function textoCabe(
  texto: string,
  font: PdfFontMetricas,
  ancho: number,
  alto: number,
  fontSize: number,
  multilinea: boolean,
): boolean {
  const alturaGlyph = font.heightAtSize(fontSize);
  if (!multilinea) {
    return (
      alturaGlyph <= alto && font.widthOfTextAtSize(texto.replace(/\s+/g, " ").trim(), fontSize) <= ancho
    );
  }
  const lineHeight = alturaGlyph + alturaGlyph * 0.2;
  const lineas = contarLineasTextoPdf(texto, font, ancho, fontSize);
  return lineas * lineHeight <= alto + 0.5;
}

/**
 * Baja desde `max` hasta que el texto quepa en el recuadro (impresión).
 * Si ni al mínimo cabe, devuelve el mínimo (el lector recortará el resto).
 */
export function tamanoFuenteQueCabe(opts: {
  texto: string;
  multilinea: boolean;
  anchoWidget: number;
  altoWidget: number;
  max: number;
  min?: number;
  font: PdfFontMetricas;
}): number {
  const min = opts.min ?? TAMANO_MIN;
  const ancho = Math.max(1, opts.anchoWidget - MARGEN_INTERNO * 2);
  const alto = Math.max(1, opts.altoWidget - MARGEN_INTERNO * 2);
  const max = Math.max(min, opts.max);
  if (!opts.texto.trim()) return max;

  for (let size = max; size >= min; size -= 0.5) {
    if (textoCabe(opts.texto, opts.font, ancho, alto, size, opts.multilinea)) {
      return size;
    }
  }
  return min;
}
