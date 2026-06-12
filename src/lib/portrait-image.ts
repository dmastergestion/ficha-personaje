const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_EDGE_PX = 512;
const TARGET_DATA_URL_CHARS = 550_000;

export function validarArchivoRetrato(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "El archivo debe ser una imagen (JPG, PNG, WebP…).";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "La imagen no puede superar 8 MB.";
  }
  return null;
}

export async function procesarArchivoRetrato(file: File): Promise<string> {
  const error = validarArchivoRetrato(file);
  if (error) throw new Error(error);

  const bitmap = await createImageBitmap(file);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");

    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.88;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > TARGET_DATA_URL_CHARS && quality > 0.45) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > TARGET_DATA_URL_CHARS) {
      throw new Error(
        "La imagen sigue siendo demasiado grande tras comprimirla. Prueba con otra más pequeña.",
      );
    }

    return dataUrl;
  } finally {
    bitmap.close();
  }
}
