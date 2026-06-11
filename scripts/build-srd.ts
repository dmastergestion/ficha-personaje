import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dnd5eRoot = path.join(root, "vendor", "dnd5e", "packs", "_source");
const outDir = path.join(root, "src", "data", "srd");

interface YamlDoc {
  _id?: string;
  name?: string;
  type?: string;
  system?: {
    identifier?: string;
    level?: number;
    school?: string;
    hd?: { denomination?: string };
    primaryAbility?: { value?: string[] };
    armor?: { value?: number; dex?: number | null };
    damage?: { base?: { number?: number; denomination?: number; types?: string[] } };
    properties?: string[];
    type?: { value?: string; baseItem?: string };
    weight?: { value?: number };
    strength?: number | null;
  };
}

function readYaml(filePath: string): YamlDoc {
  return yaml.parse(fs.readFileSync(filePath, "utf8")) as YamlDoc;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(name: string, data: unknown) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function requireVendor() {
  if (!fs.existsSync(dnd5eRoot)) {
    console.error(
      "vendor/dnd5e no encontrado. Ejecuta: git clone --depth 1 --filter=blob:none --sparse https://github.com/foundryvtt/dnd5e.git vendor/dnd5e",
    );
    process.exit(1);
  }
}

function buildClasses() {
  const files = fg.sync("classes24/*/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/_folder.yml", "**/class-features/**", "**/subclass-features/**", "**/eldritch-invocation-options/**", "**/metamagic-options/**"],
  });

  const classes: Record<string, unknown>[] = [];
  const subclasses: Record<string, unknown>[] = [];

  for (const rel of files) {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    if (!doc.type || !doc.name || !doc._id) continue;

    const folder = path.dirname(rel).split("/")[1] ?? "";
    const identifier = doc.system?.identifier ?? folder;

    if (doc.type === "class") {
      classes.push({
        id: identifier,
        srdId: doc._id,
        nameEn: doc.name,
        hitDie: doc.system?.hd?.denomination ?? "d8",
        primaryAbilities: doc.system?.primaryAbility?.value ?? [],
      });
    }

    if (doc.type === "subclass") {
      subclasses.push({
        id: identifier,
        srdId: doc._id,
        nameEn: doc.name,
        classId: folder,
      });
    }
  }

  writeJson("classes.json", classes);
  writeJson("subclasses.json", subclasses);
  return { classes: classes.length, subclasses: subclasses.length };
}

function buildArmor() {
  const files = fg.sync("equipment24/armor/**/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/magical/**", "**/_folder.yml"],
  });

  const armor: Record<string, unknown>[] = [];

  for (const rel of files) {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    if (doc.type !== "equipment" || !doc.system?.armor) continue;

    const category = doc.system.type?.value ?? "light";
    if (!["light", "medium", "heavy", "shield"].includes(category)) continue;

    armor.push({
      id: doc.system.identifier ?? doc._id,
      srdId: doc._id,
      nameEn: doc.name,
      category,
      baseAc: doc.system.armor.value ?? 10,
      dexMax: doc.system.armor.dex ?? null,
      strengthMin: doc.system.strength ?? null,
      stealthDisadvantage: false,
    });
  }

  writeJson("armor.json", armor);
  return armor.length;
}

function buildWeapons() {
  const files = fg.sync("equipment24/weapons/**/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/magical/**", "**/_folder.yml"],
  });

  const weapons: Record<string, unknown>[] = [];

  for (const rel of files) {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    if (doc.type !== "weapon" || !doc._id || !doc.name) continue;

    const sys = doc.system;
    const base = sys?.damage?.base;
    if (!base?.denomination) continue;

    const properties = sys?.properties ?? [];
    const typeVal = sys?.type?.value ?? "";
    const isRanged = typeVal.endsWith("R");
    const isFinesse = properties.includes("fin");
    const abilityKey = isRanged || isFinesse ? "dex" : "str";
    const damageDie = `${base.number ?? 1}d${base.denomination}`;

    weapons.push({
      id: sys?.identifier ?? sys?.type?.baseItem ?? doc._id,
      srdId: doc._id,
      nameEn: doc.name,
      category: typeVal,
      damageDie,
      damageType: base.types?.[0] ?? "",
      abilityKey,
      weightLb: sys?.weight?.value ?? 0,
      properties,
    });
  }

  weapons.sort((a, b) => String(a.nameEn).localeCompare(String(b.nameEn)));
  writeJson("weapons.json", weapons);
  return weapons.length;
}

function buildSpells() {
  const files = fg.sync("spells24/**/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/_folder.yml", "**/supplemental-items/**"],
  });

  const spells: Record<string, unknown>[] = [];

  for (const rel of files) {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    if (doc.type !== "spell" || !doc._id) continue;

    const properties: string[] = doc.system?.properties ?? [];
    spells.push({
      id: doc.system?.identifier ?? doc._id,
      srdId: doc._id,
      nameEn: doc.name,
      level: doc.system?.level ?? 0,
      school: doc.system?.school ?? "",
      concentration: properties.includes("concentration"),
      ritual: properties.includes("ritual"),
    });
  }

  writeJson("spells.json", spells);
  return spells.length;
}

function buildOrigins() {
  const speciesFiles = fg.sync("origins24/species/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/_folder.yml", "**/traits/**"],
  });
  const backgroundFiles = fg.sync("origins24/backgrounds/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/_folder.yml"],
  });

  const species = speciesFiles.map((rel) => {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    return {
      id: doc.system?.identifier ?? path.basename(rel, ".yml"),
      srdId: doc._id,
      nameEn: doc.name,
    };
  });

  const backgrounds = backgroundFiles.map((rel) => {
    const doc = readYaml(path.join(dnd5eRoot, rel));
    return {
      id: doc.system?.identifier ?? path.basename(rel, ".yml"),
      srdId: doc._id,
      nameEn: doc.name,
    };
  });

  writeJson("species.json", species);
  writeJson("backgrounds.json", backgrounds);
  return { species: species.length, backgrounds: backgrounds.length };
}

function main() {
  requireVendor();
  ensureDir(outDir);

  const classes = buildClasses();
  const armorCount = buildArmor();
  const weaponCount = buildWeapons();
  const spellCount = buildSpells();
  const origins = buildOrigins();

  writeJson("manifest.json", {
    version: 1,
    source: "foundryvtt/dnd5e SRD 2024 (CC-BY-4.0)",
    generatedAt: new Date().toISOString(),
    counts: {
      classes: classes.classes,
      subclasses: classes.subclasses,
      armor: armorCount,
      weapons: weaponCount,
      spells: spellCount,
      species: origins.species,
      backgrounds: origins.backgrounds,
    },
  });

  console.log("SRD generado en src/data/srd/");
  console.log(JSON.stringify({ classes, armor: armorCount, weapons: weaponCount, spells: spellCount, origins }, null, 2));
}

main();
