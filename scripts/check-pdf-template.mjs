import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = path.join(root, "public", "pdf", "pj2024-template.pdf");

if (!fs.existsSync(template)) {
  const msg =
    "Plantilla PDF no encontrada en public/pdf/pj2024-template.pdf.\n" +
    "  Ejecuta: npm run prepare:pdf-template -- <ruta/Pj2024Editable.pdf>";
  if (process.env.GITHUB_ACTIONS) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`⚠ ${msg}`);
} else {
  const mb = (fs.statSync(template).size / (1024 * 1024)).toFixed(1);
  console.log(`Plantilla PDF lista (${mb} MB).`);
}
