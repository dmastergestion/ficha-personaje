/**
 * Añade concentration y ritual a spells.json desde Foundry dnd5e (properties del YAML).
 */
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const dnd5eRoot = path.join(root, "vendor", "dnd5e", "packs", "_source");

interface SpellFlags {
  concentration: boolean;
  ritual: boolean;
}

function readFoundryFlags(): Map<string, SpellFlags> {
  const files = fg.sync("spells24/**/*.yml", {
    cwd: dnd5eRoot,
    ignore: ["**/_folder.yml", "**/supplemental-items/**"],
  });

  const bySrdId = new Map<string, SpellFlags>();

  for (const rel of files) {
    const raw = fs.readFileSync(path.join(dnd5eRoot, rel), "utf8");
    const doc = parseYaml(raw) as {
      type?: string;
      _id?: string;
      system?: { properties?: string[] };
    };
    if (doc.type !== "spell" || !doc._id) continue;

    const properties = doc.system?.properties ?? [];
    bySrdId.set(doc._id, {
      concentration: properties.includes("concentration"),
      ritual: properties.includes("ritual"),
    });
  }

  return bySrdId;
}

function main() {
  if (!fs.existsSync(dnd5eRoot)) {
    console.error(`No se encontró ${dnd5eRoot}. Clona vendor/dnd5e.`);
    process.exit(1);
  }

  const flagsBySrdId = readFoundryFlags();
  const spells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as {
    id: string;
    srdId: string;
    concentration?: boolean;
    ritual?: boolean;
  }[];

  let ritualCount = 0;
  let concCount = 0;

  const patched = spells.map((spell) => {
    const flags = flagsBySrdId.get(spell.srdId);
    const concentration = flags?.concentration ?? spell.concentration ?? false;
    const ritual = flags?.ritual ?? spell.ritual ?? false;
    if (concentration) concCount++;
    if (ritual) ritualCount++;
    return { ...spell, concentration, ritual };
  });

  fs.writeFileSync(spellsPath, `${JSON.stringify(patched, null, 2)}\n`);
  console.log(
    `Actualizados ${patched.length} conjuros: ${concCount} con concentración, ${ritualCount} rituales.`,
  );
}

main();
