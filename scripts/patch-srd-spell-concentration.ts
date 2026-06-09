import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function toId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface FiveSpell {
  name?: string;
  srd52?: boolean;
  duration?: { concentration?: boolean }[];
}

const spellsPath = path.join(root, "src", "data", "srd", "spells.json");
const xphbPath = path.join(root, "vendor", "5etools-src", "data", "spells", "spells-xphb.json");

const spells = JSON.parse(fs.readFileSync(spellsPath, "utf8")) as { id: string; nameEn: string }[];
const xphb = JSON.parse(fs.readFileSync(xphbPath, "utf8")) as { spell?: FiveSpell[] };

const concentrationById = new Map<string, boolean>();
for (const spell of xphb.spell ?? []) {
  if (!spell.srd52 || !spell.name) continue;
  concentrationById.set(
    toId(spell.name),
    spell.duration?.some((d) => d.concentration === true) ?? false,
  );
}

const patched = spells.map((spell) => ({
  ...spell,
  concentration: concentrationById.get(spell.id) ?? false,
}));

fs.writeFileSync(spellsPath, `${JSON.stringify(patched, null, 2)}\n`);
console.log(`Actualizados ${patched.length} conjuros SRD con flag de concentración.`);
