/**
 * Sustituye textos en inglés del pack PHB por traducciones ES embebidas en src/data/i18n.
 * El pack resultante se sirve en public/content-pack/ para GitHub Pages (sin importar nada).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ContentPack } from "../src/schemas/content-pack.js";
import { loadJson, writeJson } from "./i18n-shared.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const packPath = process.argv[2] ?? path.join(root, "vendor", "content-pack", "xphb-pack.json");
  const outPath = process.argv[3] ?? packPath;

  if (!fs.existsSync(packPath)) {
    console.error(`No se encontró ${packPath}`);
    process.exit(1);
  }

  const pack = loadJson<ContentPack>(packPath);
  const es = loadJson<{
    spells: Record<string, string>;
    classes: Record<string, string>;
    subclasses: Record<string, string>;
    species: Record<string, string>;
    backgrounds: Record<string, string>;
    weapons: Record<string, string>;
    armor: Record<string, string>;
  }>(path.join(root, "src/data/i18n/es.json"));

  const spellDesc = loadJson<Record<string, string>>(
    path.join(root, "src/data/i18n/spell-descriptions-es.json"),
  );
  const originDesc = loadJson<{ species: Record<string, string>; backgrounds: Record<string, string> }>(
    path.join(root, "src/data/i18n/origin-descriptions-es.json"),
  );
  const featMeta = loadJson<Record<string, { descriptionEs?: string }>>(
    path.join(root, "src/data/srd/feat-meta.json"),
  );
  const featManual = loadJson<Record<string, string>>(
    path.join(root, "src/data/i18n/feat-descriptions-es.json"),
  );

  let patched = 0;

  for (const spell of pack.spells) {
    const name = es.spells[spell.id];
    const desc = spellDesc[spell.id];
    if (name && name !== spell.nameEn) {
      spell.nameEn = name;
      patched++;
    }
    if (desc) {
      spell.description = desc;
      patched++;
    }
  }

  for (const sp of pack.species) {
    const name = es.species[sp.id];
    const traits = originDesc.species[sp.id];
    if (name) sp.nameEn = name;
    if (traits) sp.traits = traits;
    if (name || traits) patched++;
  }

  for (const bg of pack.backgrounds) {
    const name = es.backgrounds[bg.id];
    const traits = originDesc.backgrounds[bg.id];
    if (name) bg.nameEn = name;
    if (traits) bg.traits = traits;
    if (name || traits) patched++;
  }

  for (const sc of pack.subclasses) {
    const name = es.subclasses[sc.id];
    if (name) {
      sc.nameEn = name;
      patched++;
    }
  }

  for (const cls of pack.classes) {
    const name = es.classes[cls.id];
    if (name) {
      cls.nameEn = name;
      patched++;
    }
  }

  for (const w of pack.weapons) {
    const name = es.weapons[w.id];
    if (name) {
      w.nameEn = name;
      patched++;
    }
  }

  for (const a of pack.armor) {
    const name = es.armor[a.id];
    if (name) {
      a.nameEn = name;
      patched++;
    }
  }

  pack.i18nEs = {
    spells: Object.fromEntries(pack.spells.map((s) => [s.id, es.spells[s.id] ?? s.nameEn])),
    classes: Object.fromEntries(pack.classes.map((c) => [c.id, es.classes[c.id] ?? c.nameEn])),
    subclasses: Object.fromEntries(
      pack.subclasses.map((s) => [s.id, es.subclasses[s.id] ?? s.nameEn]),
    ),
    species: Object.fromEntries(pack.species.map((s) => [s.id, es.species[s.id] ?? s.nameEn])),
    backgrounds: Object.fromEntries(
      pack.backgrounds.map((b) => [b.id, es.backgrounds[b.id] ?? b.nameEn]),
    ),
    weapons: Object.fromEntries(pack.weapons.map((w) => [w.id, es.weapons[w.id] ?? w.nameEn])),
    armor: Object.fromEntries(pack.armor.map((a) => [a.id, es.armor[a.id] ?? a.nameEn])),
  };

  writeJson(outPath, pack);
  console.log(`Pack parcheado ES: ${outPath} (${patched} campos)`);
  void featMeta;
  void featManual;
}

main();
