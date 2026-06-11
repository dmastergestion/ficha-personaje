/** Extrae texto inglés de dotes y rasgos de subclase sin traducción Foundry. */
import fs from "node:fs";
import path from "node:path";
import { cleanFiveText, flattenEntries } from "./five-etools-utils.js";
import { matchFoundryFeature } from "./foundry-feature-match.js";
import { loadTranslate, projectRoot, toId } from "./i18n-shared.js";

const root = projectRoot();
const dataRoot = path.join(root, "vendor", "5etools-src", "data");

const meta = loadJson<Record<string, { description?: string; descriptionEs?: string }>>(
  path.join(root, "src/data/srd/feat-meta.json"),
);
const en = /\b(the|you|your|when|with)\b/i;
const featsOut: Record<string, string> = {};
for (const [id, f] of Object.entries(meta)) {
  if (en.test(f.descriptionEs ?? "") && f.description) {
    featsOut[id] = cleanFiveText(f.description);
  }
}
writeJson(path.join(root, "data/i18n/_feats-en-extract.json"), featsOut);

const classesTr = loadTranslate("dnd5e.classes24.json");
const entries = classesTr.entries ?? {};
const files = fs
  .readdirSync(path.join(dataRoot, "class"))
  .filter((f) => f.startsWith("class-") && f.endsWith(".json"));

const scOut: Record<
  string,
  { subclassId: string; level: number; nameEn: string; description: string }
> = {};
for (const file of files) {
  const data = loadJson<{
    subclassFeature?: {
      name?: string;
      entries?: unknown;
      source?: string;
      className?: string;
      subclassShortName?: string;
      level?: number;
    }[];
  }>(path.join(dataRoot, "class", file));

  for (const feat of data.subclassFeature ?? []) {
    if (feat.source !== "XPHB" || !feat.name || feat.level === undefined) continue;
    if (/^(Path of|College of|Domain of|Oath of|Circle of|Primal Path|Druid Circle)/i.test(feat.name))
      continue;

    const subclassId = toId(feat.subclassShortName ?? "");
    const classId = toId(feat.className ?? "");
    if (matchFoundryFeature(classId, feat.name, entries)) continue;

    const key = `${subclassId}::${feat.level}::${feat.name}`;
    scOut[key] = {
      subclassId,
      level: feat.level,
      nameEn: feat.name,
      description: cleanFiveText(flattenEntries(feat.entries)),
    };
  }
}
writeJson(path.join(root, "data/i18n/_subclass-features-en-extract.json"), scOut);
console.log(`feats ${Object.keys(featsOut).length}, subclass ${Object.keys(scOut).length}`);

function loadJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}
function writeJson(p: string, data: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
