/**
 * Genera descripciones en español de especies y trasfondos desde translate-dnd5e-sdr2-es.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFoundryAPlano } from "../src/lib/foundry-text-clean.ts";
import {
  limpiarTextoOrigen,
  personalizarEspeciePorId,
} from "../src/lib/origin-text.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srdDir = path.join(root, "src", "data", "srd");
const outPath = path.join(root, "src", "data", "i18n", "origin-descriptions-es.json");
const manualPath = path.join(root, "data", "i18n", "origin-descriptions-manual.json");
const curatedSpeciesPath = path.join(root, "data", "i18n", "species-curated-es.json");

function translateCompendiumDir(): string | null {
  for (const dir of ["translate-dnd5e-sdr2-es", "translate-dnd5e-sdr2-es-tmp"]) {
    const comp = path.join(root, "vendor", dir, "compendium");
    if (fs.existsSync(comp)) return comp;
  }
  return null;
}

type OriginsFile = {
  entries?: Record<string, { name?: string; description?: string }>;
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function main() {
  const compDir = translateCompendiumDir();
  const manual = fs.existsSync(manualPath)
    ? loadJson<{ species?: Record<string, string>; backgrounds?: Record<string, string> }>(
        manualPath,
      )
    : { species: {}, backgrounds: {} };
  const curatedSpecies = fs.existsSync(curatedSpeciesPath)
    ? loadJson<Record<string, string>>(curatedSpeciesPath)
    : {};

  const manualSpecies = { ...curatedSpecies, ...manual.species };
  const speciesOut: Record<string, string> = { ...manualSpecies };
  const backgroundsOut: Record<string, string> = { ...manual.backgrounds };

  if (compDir) {
    const originsPath = path.join(compDir, "dnd5e.origins24.json");
    if (fs.existsSync(originsPath)) {
      const origins = loadJson<OriginsFile>(originsPath);
      const species = fs.existsSync(path.join(srdDir, "species.json"))
        ? loadJson<{ id: string; srdId?: string }[]>(path.join(srdDir, "species.json"))
        : [];
      const backgrounds = fs.existsSync(path.join(srdDir, "backgrounds.json"))
        ? loadJson<{ id: string; srdId?: string }[]>(path.join(srdDir, "backgrounds.json"))
        : [];

      const speciesBySrd = new Map(
        species.filter((s) => s.srdId).map((s) => [s.srdId!, s.id]),
      );
      const bgBySrd = new Map(
        backgrounds.filter((b) => b.srdId).map((b) => [b.srdId!, b.id]),
      );

      const packPath = path.join(root, "vendor", "content-pack", "xphb-pack.json");
      const packSpecies = fs.existsSync(packPath)
        ? (loadJson<{ species?: { id: string }[] }>(packPath).species ?? [])
        : [];

      for (const [srdId, entry] of Object.entries(origins.entries ?? {})) {
        if (!entry.description) continue;
        const text = htmlFoundryAPlano(entry.description);
        if (!text) continue;

        if (srdId.startsWith("phbsp")) {
          const id = speciesBySrd.get(srdId);
          if (id) speciesOut[id] = text;

          const prefix = id?.split("-")[0];
          if (prefix) {
            for (const sp of packSpecies) {
              if (sp.id.startsWith(`${prefix}-`) && !speciesOut[sp.id]) {
                speciesOut[sp.id] = text;
              }
            }
          }
        } else if (srdId.startsWith("phbbg")) {
          const id = bgBySrd.get(srdId);
          if (id) backgroundsOut[id] = text;
        }
      }
    }
  }

  for (const [id, text] of Object.entries(speciesOut)) {
    if (!manualSpecies[id]) {
      speciesOut[id] = personalizarEspeciePorId(id, limpiarTextoOrigen(text));
    }
  }
  Object.assign(speciesOut, manualSpecies);

  for (const id of Object.keys(speciesOut)) {
    if (id.startsWith("dragonborn-") && manualSpecies.dragonborn && !manualSpecies[id]) {
      speciesOut[id] = personalizarEspeciePorId(id, manualSpecies.dragonborn);
    }
    if (id.startsWith("goliath-") && manualSpecies.goliath && !manualSpecies[id]) {
      speciesOut[id] = personalizarEspeciePorId(id, manualSpecies.goliath);
    }
  }

  Object.assign(backgroundsOut, manual.backgrounds ?? {});

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    `${JSON.stringify({ species: speciesOut, backgrounds: backgroundsOut }, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        species: Object.keys(speciesOut).length,
        backgrounds: Object.keys(backgroundsOut).length,
        translate: !!compDir,
      },
      null,
      2,
    ),
  );
}

main();
