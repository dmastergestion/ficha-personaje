/**
 * Genera metadatos SRD para armas, especies y trasfondos desde 5etools.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  extractBackgroundDetails,
  extractFeatDetails,
  extractSpeciesDetails,
  stripHtml,
} from "./five-etools-utils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "vendor", "5etools-src", "data");
const srdDir = path.join(root, "src", "data", "srd");

function toId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const SPECIES_ALIASES: Record<string, string> = {
  "elf-drow": "elf",
  "elf-high": "elf",
  "elf-wood": "elf",
  "gnome-forest": "gnome",
  "gnome-rock": "gnome",
  "tiefling-abyssal": "tiefling",
  "tiefling-chthonic": "tiefling",
  "tiefling-infernal": "tiefling",
};

function buildWeaponMeta() {
  const weapons = JSON.parse(
    fs.readFileSync(path.join(srdDir, "weapons.json"), "utf8"),
  ) as { id: string; nameEn: string }[];
  const base = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "items-base.json"), "utf8"),
  ) as { baseitem?: { name?: string; weapon?: boolean; dmg2?: string; range?: string }[] };

  const byId = new Map(
    (base.baseitem ?? [])
      .filter((i) => i.weapon && i.name)
      .map((i) => [toId(i.name!), i]),
  );

  const meta: Record<string, { versatileDamageDie?: string; range?: string }> = {};
  for (const w of weapons) {
    const item = byId.get(w.id);
    if (!item) continue;
    const row: { versatileDamageDie?: string; range?: string } = {};
    if (item.dmg2) row.versatileDamageDie = item.dmg2;
    if (item.range) row.range = String(item.range);
    if (Object.keys(row).length) meta[w.id] = row;
  }
  return meta;
}

function buildSpeciesMeta() {
  const species = JSON.parse(
    fs.readFileSync(path.join(srdDir, "species.json"), "utf8"),
  ) as { id: string; nameEn: string }[];
  const races = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "races.json"), "utf8"),
  ) as {
    race?: {
      name?: string;
      source?: string;
      entries?: unknown;
      size?: string[];
      speed?: number;
      skillProficiencies?: unknown;
      _versions?: {
        name?: string;
        source?: string;
        entries?: unknown;
      }[];
    }[];
  };

  const xphb = (races.race ?? []).filter((r) => r.source === "XPHB");
  const byName = new Map(xphb.map((r) => [(r.name ?? "").toLowerCase(), r]));

  const meta: Record<
    string,
    {
      size?: string;
      speed?: number;
      skillProficiencies?: string[];
      traits?: string;
    }
  > = {};

  for (const sp of species) {
    const parentName = SPECIES_ALIASES[sp.id] ?? sp.id;
    const race = byName.get(parentName) ?? byName.get(sp.nameEn.split(",")[0]?.trim().toLowerCase() ?? "");
    if (!race) continue;

    let entries = race.entries;
    const variantSuffix = sp.nameEn.includes(",") ? sp.nameEn.split(",")[1]?.trim() : null;
    if (variantSuffix && race._versions) {
      const ver = race._versions.find((v) =>
        v.name?.toLowerCase().includes(variantSuffix.toLowerCase()),
      );
      if (ver?.entries) entries = ver.entries;
    }

    const details = extractSpeciesDetails({ ...race, entries });
    if (details.traits || details.size || details.speed) {
      meta[sp.id] = details;
    }
  }
  return meta;
}

function buildBackgroundMeta() {
  const backgrounds = JSON.parse(
    fs.readFileSync(path.join(srdDir, "backgrounds.json"), "utf8"),
  ) as { id: string; nameEn: string }[];
  const data = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "backgrounds.json"), "utf8"),
  ) as {
    background?: {
      name?: string;
      source?: string;
      skillProficiencies?: unknown;
      toolProficiencies?: unknown;
      feats?: Record<string, boolean>[];
      entries?: unknown;
    }[];
  };

  const byId = new Map(
    (data.background ?? [])
      .filter((b) => b.source === "XPHB" && b.name)
      .map((b) => [toId(b.name!), b]),
  );

  const meta: Record<
    string,
    {
      skillProficiencies?: string[];
      toolProficiencies?: string[];
      feat?: string;
      traits?: string;
    }
  > = {};

  for (const bg of backgrounds) {
    const entry = byId.get(bg.id);
    if (!entry) continue;
    meta[bg.id] = extractBackgroundDetails(entry);
  }
  return meta;
}

const FEAT_CATEGORY_LABEL_ES: Record<string, string> = {
  general: "General",
  origin: "Origen",
  "fighting-style": "Estilo de combate",
  "epic-boon": "Bendición épica",
};

function buildFeatMeta() {
  const namesEsPath = path.join(root, "data", "i18n", "feat-names-es.json");
  const namesEs = JSON.parse(fs.readFileSync(namesEsPath, "utf8")) as Record<string, string>;

  const translatePath = path.join(
    root,
    "vendor",
    "translate-dnd5e-sdr2-es",
    "compendium",
    "dnd5e.feats24.json",
  );
  const translate = fs.existsSync(translatePath)
    ? (JSON.parse(fs.readFileSync(translatePath, "utf8")) as {
        entries?: Record<string, { name?: string; description?: string }>;
      })
    : { entries: {} };

  const data = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "feats.json"), "utf8"),
  ) as {
    feat?: {
      name?: string;
      source?: string;
      category?: string;
      entries?: unknown;
      prerequisite?: unknown;
      repeatable?: boolean;
      srd52?: boolean;
    }[];
  };

  const xphb = (data.feat ?? []).filter((f) => f.source === "XPHB" && f.name);
  const meta: Record<
    string,
    {
      name: string;
      nameEs: string;
      category: string;
      categoryLabel: string;
      description?: string;
      descriptionEs?: string;
      prerequisite?: string;
      repeatable?: boolean;
      srd52?: boolean;
    }
  > = {};

  const srdList: { id: string; srdId: string; nameEn: string }[] = [];

  for (const feat of xphb) {
    const id = toId(feat.name!);
    const details = extractFeatDetails(feat);
    const nameEs = namesEs[id] ?? details.nameEn;
    meta[id] = {
      name: details.nameEn,
      nameEs,
      category: details.category,
      categoryLabel: FEAT_CATEGORY_LABEL_ES[details.category] ?? details.category,
      description: details.description,
      prerequisite: details.prerequisite,
      repeatable: details.repeatable,
      srd52: details.srd52,
    };
    srdList.push({ id, srdId: id, nameEn: details.nameEn });
  }

  const esNameToId = new Map(
    Object.entries(namesEs).map(([id, name]) => [name.toLowerCase(), id]),
  );
  for (const entry of Object.values(translate.entries ?? {})) {
    if (!entry.name || !entry.description) continue;
    const id = esNameToId.get(entry.name.toLowerCase());
    if (!id || !meta[id]) continue;
    meta[id].descriptionEs = stripHtml(entry.description);
  }

  return { meta, srdList, i18n: Object.fromEntries(srdList.map((f) => [f.id, namesEs[f.id] ?? f.nameEn])) };
}

function main() {
  if (!fs.existsSync(dataRoot)) {
    console.error("vendor/5etools-src/data no encontrado. Ejecuta: npm run fetch:5etools");
    process.exit(1);
  }

  const weaponMeta = buildWeaponMeta();
  const speciesMeta = buildSpeciesMeta();
  const backgroundMeta = buildBackgroundMeta();
  const { meta: featMeta, srdList: feats, i18n: featsI18n } = buildFeatMeta();

  fs.writeFileSync(
    path.join(srdDir, "weapon-meta.json"),
    `${JSON.stringify(weaponMeta, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(srdDir, "species-meta.json"),
    `${JSON.stringify(speciesMeta, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(srdDir, "background-meta.json"),
    `${JSON.stringify(backgroundMeta, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(srdDir, "feat-meta.json"),
    `${JSON.stringify(featMeta, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(srdDir, "feats.json"), `${JSON.stringify(feats, null, 2)}\n`);

  const esPath = path.join(root, "src", "data", "i18n", "es.json");
  const esBundle = JSON.parse(fs.readFileSync(esPath, "utf8")) as Record<string, unknown>;
  esBundle.feats = { ...(esBundle.feats as Record<string, string>), ...featsI18n };
  fs.writeFileSync(esPath, `${JSON.stringify(esBundle, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        weapons: Object.keys(weaponMeta).length,
        species: Object.keys(speciesMeta).length,
        backgrounds: Object.keys(backgroundMeta).length,
        feats: Object.keys(featMeta).length,
        featsSrd: Object.values(featMeta).filter((f) => f.srd52).length,
        featsDescriptionEs: Object.values(featMeta).filter((f) => f.descriptionEs).length,
      },
      null,
      2,
    ),
  );
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) main();
