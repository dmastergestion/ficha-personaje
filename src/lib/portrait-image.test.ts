import { describe, expect, it } from "vitest";
import { validarArchivoRetrato } from "@/lib/portrait-image";

describe("validarArchivoRetrato", () => {
  it("rechaza archivos que no son imagen", () => {
    const file = new File(["x"], "doc.txt", { type: "text/plain" });
    expect(validarArchivoRetrato(file)).toMatch(/imagen/i);
  });

  it("acepta imágenes pequeñas", () => {
    const file = new File(["x"], "foto.jpg", { type: "image/jpeg" });
    expect(validarArchivoRetrato(file)).toBeNull();
  });
});
