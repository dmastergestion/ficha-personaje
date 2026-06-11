/**
 * Aplica pulido editorial a los JSON manuales PHB en data/i18n/.
 */
import fs from "node:fs";
import path from "node:path";
import { pulirTextoReglasEs } from "../src/lib/rules-text-polish.js";
import { projectRoot, writeJson } from "./i18n-shared.js";

const root = projectRoot();

function polishFlat(pathRel: string): number {
  const full = path.join(root, pathRel);
  const data = JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, string>;
  let changed = 0;
  for (const [key, value] of Object.entries(data)) {
    const next = pulirTextoReglasEs(value);
    if (next !== value) {
      data[key] = next;
      changed++;
    }
  }
  writeJson(full, data);
  return changed;
}

function polishSubclassFeatures(): number {
  const full = path.join(root, "data/i18n/subclass-features-manual.json");
  const data = JSON.parse(fs.readFileSync(full, "utf8")) as Record<
    string,
    { name?: string; description?: string }
  >;
  let changed = 0;
  for (const entry of Object.values(data)) {
    if (!entry.description) continue;
    const next = pulirTextoReglasEs(entry.description);
    if (next !== entry.description) {
      entry.description = next;
      changed++;
    }
  }
  writeJson(full, data);
  return changed;
}

function polishOriginDescriptions(): number {
  const full = path.join(root, "data/i18n/origin-descriptions-manual.json");
  const data = JSON.parse(fs.readFileSync(full, "utf8")) as {
    species: Record<string, string>;
    backgrounds: Record<string, string>;
  };
  let changed = 0;
  for (const map of [data.species, data.backgrounds]) {
    for (const [key, value] of Object.entries(map)) {
      const next = pulirTextoReglasEs(value);
      if (next !== value) {
        map[key] = next;
        changed++;
      }
    }
  }
  writeJson(full, data);
  return changed;
}

const flatFiles = [
  "data/i18n/phb-spell-descriptions-manual.json",
  "data/i18n/feat-descriptions-es.json",
  "data/i18n/background-descriptions-manual.json",
  "data/i18n/srd-spell-descriptions-manual.json",
];

let total = 0;
for (const rel of flatFiles) {
  const n = polishFlat(rel);
  console.log(`${rel}: ${n} entradas pulidas`);
  total += n;
}

const sub = polishSubclassFeatures();
console.log(`subclass-features-manual.json: ${sub} entradas pulidas`);
total += sub;

const origin = polishOriginDescriptions();
console.log(`origin-descriptions-manual.json: ${origin} entradas pulidas`);
total += origin;

console.log(`Total: ${total} textos actualizados.`);
