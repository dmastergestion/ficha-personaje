import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.GITHUB_ACTIONS) {
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = path.join(root, "public", "pdf", "pj2024-template.pdf");

if (!fs.existsSync(template)) {
  console.warn(
    "⚠ Plantilla PDF no encontrada en public/pdf/pj2024-template.pdf — export PDF desactivado en local.",
  );
  console.warn("  Ejecuta: npm run prepare:pdf-template -- <ruta/Pj2024Editable.pdf>");
} else {
  const mb = (fs.statSync(template).size / (1024 * 1024)).toFixed(1);
  console.log(`Plantilla PDF lista (${mb} MB).`);
}
