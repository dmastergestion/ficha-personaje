import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srdDir = path.join(root, "src", "data", "srd");
const i18nDir = path.join(root, "src", "data", "i18n");
const translateRoot = path.join(root, "vendor", "translate-dnd5e-sdr2-es", "compendium");
const overridesPath = path.join(root, "data", "i18n", "overrides.es.json");

interface SrdItem {
  id: string;
  srdId?: string;
  nameEn?: string;
}

interface TranslateFile {
  folders?: Record<string, string>;
  entries?: Record<string, { name?: string }>;
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function loadTranslate(name: string): TranslateFile {
  const filePath = path.join(translateRoot, name);
  if (!fs.existsSync(filePath)) return {};
  return loadJson<TranslateFile>(filePath);
}

function translateBySrdId(
  items: SrdItem[],
  entries: Record<string, { name?: string }> | undefined,
  folders: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of items) {
    const fromEntry = item.srdId ? entries?.[item.srdId]?.name : undefined;
    const fromFolder = item.nameEn ? folders?.[item.nameEn] : undefined;
    out[item.id] = fromEntry ?? fromFolder ?? item.nameEn ?? item.id;
  }
  return out;
}

function main() {
  if (!fs.existsSync(srdDir)) {
    console.error("Ejecuta npm run build:srd primero.");
    process.exit(1);
  }

  const classes = loadJson<SrdItem[]>(path.join(srdDir, "classes.json"));
  const subclasses = loadJson<SrdItem[]>(path.join(srdDir, "subclasses.json"));
  const armor = loadJson<SrdItem[]>(path.join(srdDir, "armor.json"));
  const weapons = loadJson<SrdItem[]>(path.join(srdDir, "weapons.json"));
  const spells = loadJson<SrdItem[]>(path.join(srdDir, "spells.json"));
  const species = loadJson<SrdItem[]>(path.join(srdDir, "species.json"));
  const backgrounds = loadJson<SrdItem[]>(path.join(srdDir, "backgrounds.json"));
  const feats = fs.existsSync(path.join(srdDir, "feats.json"))
    ? loadJson<SrdItem[]>(path.join(srdDir, "feats.json"))
    : [];

  const classesTr = loadTranslate("dnd5e.classes24.json");
  const equipmentTr = loadTranslate("dnd5e.equipment24.json");
  const spellsTr = loadTranslate("dnd5e.spells24.json");
  const originsTr = loadTranslate("dnd5e.origins24.json");
  const featsTr = loadTranslate("dnd5e.feats24.json");
  const featNamesEs = fs.existsSync(path.join(root, "data", "i18n", "feat-names-es.json"))
    ? loadJson<Record<string, string>>(path.join(root, "data", "i18n", "feat-names-es.json"))
    : {};

  const overrides = fs.existsSync(overridesPath)
    ? loadJson<Record<string, Record<string, string>>>(overridesPath)
    : {};

  const payload = {
    classes: translateBySrdId(classes, classesTr.entries, classesTr.folders),
    subclasses: translateBySrdId(subclasses, classesTr.entries, classesTr.folders),
    armor: translateBySrdId(armor, equipmentTr.entries, equipmentTr.folders),
    weapons: translateBySrdId(weapons, equipmentTr.entries, equipmentTr.folders),
    spells: translateBySrdId(spells, spellsTr.entries, spellsTr.folders),
    species: translateBySrdId(species, originsTr.entries, originsTr.folders),
    backgrounds: translateBySrdId(backgrounds, originsTr.entries, originsTr.folders),
    feats: {
      ...translateBySrdId(feats, featsTr.entries, featsTr.folders),
      ...featNamesEs,
      ...overrides.feats,
    },
    ui: {
      appName: "Ficha de personaje D&D 2024",
      offline: "Modo offline",
      installHint: "Instala la app desde el menú del navegador para usarla sin conexión.",
      ...overrides.ui,
    },
  };

  fs.mkdirSync(i18nDir, { recursive: true });
  fs.writeFileSync(
    path.join(i18nDir, "es.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  console.log("i18n/es.json generado.");
}

main();
