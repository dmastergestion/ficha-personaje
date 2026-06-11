/**
 * Genera descripciones en español de conjuros desde translate-dnd5e-sdr2-es.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripHtml } from "./five-etools-utils.js";
import { limpiarTextoConjuro } from "../src/lib/spell-text-clean.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const translatePath = path.join(
  root,
  "vendor",
  "translate-dnd5e-sdr2-es",
  "compendium",
  "dnd5e.spells24.json",
);
const outPath = path.join(root, "src", "data", "i18n", "spell-descriptions-es.json");

function main() {
  if (!fs.existsSync(translatePath)) {
    console.error(`No se encontró ${translatePath}.`);
    process.exit(1);
  }

  const spells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as { id: string; srdId: string }[];
  const translate = JSON.parse(fs.readFileSync(translatePath, "utf8")) as {
    entries?: Record<string, { description?: string }>;
  };

  const descriptions: Record<string, string> = {};
  let matched = 0;

  for (const spell of spells) {
    const entry = translate.entries?.[spell.srdId];
    if (!entry?.description) continue;
    descriptions[spell.id] = limpiarTextoConjuro(stripHtml(entry.description));
    matched++;
  }

  fs.writeFileSync(outPath, `${JSON.stringify(descriptions, null, 2)}\n`);
  console.log(
    JSON.stringify(
      { total: spells.length, matched, out: path.relative(root, outPath) },
      null,
      2,
    ),
  );
}

main();
