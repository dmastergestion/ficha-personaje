/**
 * Genera traducciones PHB en español (conjuros, dotes, trasfondos, subclases).
 * Requiere: vendor/5etools-src, vendor/translate-dnd5e-sdr2-es, vendor/content-pack/xphb-pack.json
 */
import fs from "node:fs";
import path from "node:path";
import { limpiarTextoConjuro } from "../src/lib/spell-text-clean.js";
import { traducirTextoDnD, PHB_SPELL_NAMES_ES } from "../src/lib/dnd-translate-en-es.js";
import { htmlFoundryAPlano } from "../src/lib/foundry-text-clean.js";
import { cleanFiveText, flattenEntries } from "./five-etools-utils.js";
import {
  foundryDescription,
  indexFoundryBySpanishName,
  loadJson,
  loadTranslate,
  mergeManual,
  projectRoot,
  resolvePackSpellToSrdId,
  sanitizarTerminosFoundryEs,
  SPELL_SRD_ALIASES,
  toId,
  writeJson,
} from "./i18n-shared.js";
import { matchFoundryFeature, norm as normFeature } from "./foundry-feature-match.js";

const root = projectRoot();
const packPath = path.join(root, "vendor", "content-pack", "xphb-pack.json");
const dataRoot = path.join(root, "vendor", "5etools-src", "data");

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function buildSpellDescriptions(): Record<string, string> {
  const existing = loadJson<Record<string, string>>(
    path.join(root, "src/data/i18n/spell-descriptions-es.json"),
  );
  const packEn = loadJson<{ spells: { id: string; nameEn: string; description?: string }[] }>(
    packPath,
  );
  const pack = packEn;
  const spellsTr = loadTranslate("dnd5e.spells24.json");
  const foundryByKey = spellsTr.entries ?? {};
  const srdSpells = loadJson<{ id: string; srdId?: string }[]>(
    path.join(root, "src/data/srd/spells.json"),
  );
  const srdById = new Map(srdSpells.map((s) => [s.id, s]));
  const srdSpellIds = new Set(srdSpells.map((s) => s.id));
  const spellDescByEnName = new Map<string, string>();
  for (const s of srdSpells) {
    if (!s.srdId || !s.nameEn) continue;
    const desc = foundryDescription(foundryByKey[s.srdId]);
    if (desc) spellDescByEnName.set(norm(s.nameEn), limpiarTextoConjuro(desc));
  }
  for (const [srdId, aliasEn] of Object.entries(SPELL_SRD_ALIASES)) {
    const base = srdSpells.find((s) => s.id === srdId);
    if (!base?.nameEn) continue;
    const desc = spellDescByEnName.get(norm(base.nameEn));
    if (desc) spellDescByEnName.set(norm(aliasEn), desc);
  }

  const spellManual = mergeManual(
    {},
    path.join(root, "data/i18n/phb-spell-descriptions-manual.json"),
  );

  const out = { ...existing };
  let added = 0;

  for (const spell of pack.spells) {
    if (spellManual[spell.id]) {
      if (out[spell.id] !== spellManual[spell.id]) {
        out[spell.id] = spellManual[spell.id]!;
        added++;
      }
      continue;
    }
    const srdId = resolvePackSpellToSrdId(spell.id, spell.nameEn, srdSpellIds);
    if (srdId && out[srdId]) {
      if (out[spell.id] !== out[srdId]) {
        out[spell.id] = out[srdId]!;
        added++;
      }
      continue;
    }

    const srdRow = srdById.get(spell.id);
    const foundry =
      (srdRow?.srdId ? foundryByKey[srdRow.srdId] : undefined) ??
      Object.values(foundryByKey).find(
        (e) => e.name && norm(e.name) === norm(PHB_SPELL_NAMES_ES[spell.id] ?? ""),
      );

    const fromFoundry = foundryDescription(foundry);
    if (fromFoundry) {
      const text = limpiarTextoConjuro(fromFoundry);
      if (out[spell.id] !== text) {
        out[spell.id] = text;
        added++;
      }
      continue;
    }

    const byEnName = spellDescByEnName.get(norm(spell.nameEn));
    if (byEnName) {
      if (out[spell.id] !== byEnName) {
        out[spell.id] = byEnName;
        added++;
      }
      continue;
    }

    if (spell.description) {
      const text = limpiarTextoConjuro(traducirTextoDnD(cleanFiveText(spell.description)));
      out[spell.id] = text;
      added++;
    }
  }

  const srdSpellManual = mergeManual(
    {},
    path.join(root, "data/i18n/srd-spell-descriptions-manual.json"),
  );
  for (const [id, text] of Object.entries(srdSpellManual)) {
    if (out[id] !== text) {
      out[id] = text;
      added++;
    }
  }

  writeJson(path.join(root, "src/data/i18n/spell-descriptions-es.json"), out);
  console.log(`spell-descriptions-es: +${added} entradas PHB (total ${Object.keys(out).length})`);
  return out;
}

function buildSpellNames(): Record<string, string> {
  const esPath = path.join(root, "src/data/i18n/es.json");
  const es = loadJson<{
    spells: Record<string, string>;
    classes: Record<string, string>;
    subclasses: Record<string, string>;
    species: Record<string, string>;
    backgrounds: Record<string, string>;
    weapons: Record<string, string>;
    armor: Record<string, string>;
    feats: Record<string, string>;
  }>(esPath);

  const pack = loadJson<{
    spells: { id: string; nameEn: string }[];
    classes: { id: string; nameEn: string }[];
    subclasses: { id: string; nameEn: string }[];
    species: { id: string; nameEn: string }[];
    backgrounds: { id: string; nameEn: string }[];
    weapons: { id: string; nameEn: string }[];
    armor: { id: string; nameEn: string }[];
  }>(packPath);

  const phbManual = fs.existsSync(path.join(root, "src/data/i18n/phb-es-manual.json"))
    ? loadJson<Record<string, Record<string, string>>>(
        path.join(root, "src/data/i18n/phb-es-manual.json"),
      )
    : {};

  const spellsTr = loadTranslate("dnd5e.spells24.json");
  const classesTr = loadTranslate("dnd5e.classes24.json");
  const equipmentTr = loadTranslate("dnd5e.equipment24.json");
  const originsTr = loadTranslate("dnd5e.origins24.json");
  const srdSpellIds = new Set(
    loadJson<{ id: string }[]>(path.join(root, "src/data/srd/spells.json")).map((s) => s.id),
  );

  const mergeCat = (
    cat: keyof typeof es,
    items: { id: string; nameEn: string }[],
    manual?: Record<string, string>,
    folders?: Record<string, string>,
  ) => {
    for (const item of items) {
      if (es[cat][item.id] && es[cat][item.id] !== item.nameEn) continue;
      const manualName = manual?.[item.id];
      const folderName = folders?.[item.nameEn];
      const spellName =
        cat === "spells"
          ? PHB_SPELL_NAMES_ES[item.id] ??
            (() => {
              const srdId = resolvePackSpellToSrdId(item.id, item.nameEn, srdSpellIds);
              if (srdId && es.spells[srdId]) return es.spells[srdId];
              return undefined;
            })()
          : undefined;
      es[cat][item.id] = manualName ?? folderName ?? spellName ?? es[cat][item.id] ?? item.nameEn;
    }
  };

  mergeCat("spells", pack.spells, undefined, spellsTr.folders);
  mergeCat("classes", pack.classes, undefined, classesTr.folders);
  mergeCat("subclasses", pack.subclasses, phbManual.subclasses, classesTr.folders);
  mergeCat("species", pack.species, phbManual.species, originsTr.folders);
  mergeCat("backgrounds", pack.backgrounds, phbManual.backgrounds, originsTr.folders);
  mergeCat("weapons", pack.weapons, undefined, equipmentTr.folders);
  mergeCat("armor", pack.armor, undefined, equipmentTr.folders);

  for (const [id, name] of Object.entries(PHB_SPELL_NAMES_ES)) {
    if (!es.spells[id] || es.spells[id] === id) es.spells[id] = name;
  }

  writeJson(esPath, es);
  console.log("es.json actualizado con nombres PHB.");
  return es.spells;
}

function buildFeatDescriptions(): void {
  const featMetaPath = path.join(root, "src/data/srd/feat-meta.json");
  const featMeta = loadJson<
    Record<string, { name: string; nameEs: string; description?: string; descriptionEs?: string }>
  >(featMetaPath);
  const manualPath = path.join(root, "data/i18n/feat-descriptions-es.json");
  const outManualPath = path.join(root, "src/data/i18n/feat-descriptions-es.json");
  const manual = mergeManual(
    fs.existsSync(outManualPath) ? loadJson(outManualPath) : {},
    manualPath,
  );

  const featsTr = loadTranslate("dnd5e.feats24.json");
  const byEsName = indexFoundryBySpanishName(featsTr.entries);

  let addedMeta = 0;
  let addedManual = 0;

  const manualSource = mergeManual(
    fs.existsSync(outManualPath) ? loadJson<Record<string, string>>(outManualPath) : {},
    manualPath,
  );

  for (const [id, feat] of Object.entries(featMeta)) {
    if (manualSource[id]) {
      manual[id] = manualSource[id];
      feat.descriptionEs = manualSource[id];
      continue;
    }

    const fromFoundry =
      foundryDescription(byEsName.get(feat.nameEs.toLowerCase())) ??
      foundryDescription(
        Object.values(featsTr.entries ?? {}).find(
          (e) => e.name && normFeature(e.name) === normFeature(feat.name),
        ),
      );
    if (fromFoundry) {
      feat.descriptionEs = htmlFoundryAPlano(fromFoundry);
      addedMeta++;
      continue;
    }

    if (feat.description) {
      const text = traducirTextoDnD(cleanFiveText(feat.description));
      manual[id] = text;
      feat.descriptionEs = text;
      addedManual++;
    }
  }

  writeJson(featMetaPath, featMeta);
  writeJson(outManualPath, manual);
  console.log(`feat descriptions: +${addedMeta} en meta, +${addedManual} en manual`);
}

function buildBackgroundDescriptions(): void {
  const outPath = path.join(root, "src/data/i18n/origin-descriptions-es.json");
  const current = loadJson<{ species: Record<string, string>; backgrounds: Record<string, string> }>(
    outPath,
  );
  const manualPath = path.join(root, "data/i18n/background-descriptions-manual.json");
  const manual = fs.existsSync(manualPath)
    ? loadJson<Record<string, string>>(manualPath)
    : {};

  const bgMeta = loadJson<Record<string, { traits?: string }>>(
    path.join(root, "src/data/srd/background-meta.json"),
  );

  const backgrounds = { ...current.backgrounds };
  let added = 0;

  for (const [id, meta] of Object.entries(bgMeta)) {
    if (manual[id]) {
      backgrounds[id] = manual[id];
      added++;
      continue;
    }
    if (meta.traits) {
      const text = traducirTraitsTrasfondo(meta.traits);
      if (backgrounds[id] !== text) {
        backgrounds[id] = text;
        added++;
      }
    }
  }

  writeJson(outPath, { ...current, backgrounds });
  console.log(`origin-descriptions-es backgrounds: +${added}`);
}

const SKILL_ES: Record<string, string> = {
  investigation: "Investigación",
  persuasion: "Persuasión",
  deception: "Engaño",
  "sleight of hand": "Juego de manos",
  athletics: "Atletismo",
  insight: "Perspicacia",
  religion: "Religión",
  survival: "Supervivencia",
  medicine: "Medicina",
  perception: "Percepción",
  stealth: "Sigilo",
  intimidation: "Intimidación",
  performance: "Interpretación",
  history: "Historia",
  "animal handling": "Trato con animales",
  arcana: "Arcanos",
  nature: "Naturaleza",
  acrobatics: "Acrobacias",
};

const FEAT_NAME_ES: Record<string, string> = {
  Alert: "Alerta",
  Crafter: "Artesano",
  Healer: "Sanador",
  Lucky: "Afortunado",
  Musician: "Músico",
  Skilled: "Hábil",
  Tough: "Duro",
  "Savage Attacker": "Atacante salvaje",
  "Tavern Brawler": "Pendenciero de taberna",
  "Magic Initiate": "Iniciado en la magia",
};

function traducirTraitsTrasfondo(traits: string): string {
  return traits
    .split(/\s{2,}/)
    .map((chunk) => {
      const [label, ...rest] = chunk.split("::");
      if (!rest.length) return traducirTextoDnD(cleanFiveText(chunk));
      const key = label?.trim() ?? "";
      const labelEs: Record<string, string> = {
        "Ability Scores": "Atributos",
        Feat: "Dote",
        "Skill Proficiencies": "Pericias",
        "Tool Proficiency": "Herramienta",
        Equipment: "Equipo",
      };
      let body = cleanFiveText(rest.join("::").trim())
        .replace(/\{@feat ([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
        .replace(/\bStrength\b/g, "Fuerza")
        .replace(/\bDexterity\b/g, "Destreza")
        .replace(/\bIntelligence\b/g, "Inteligencia")
        .replace(/\bWisdom\b/g, "Sabiduría")
        .replace(/\bCharisma\b/g, "Carisma")
        .replace(/\bConstitution\b/g, "Constitución");
      for (const [en, es] of Object.entries(SKILL_ES)) {
        body = body.replace(new RegExp(`\\b${en}\\b`, "gi"), es);
      }
      body = body.replace(/\bChoose one kind of Artisan's Tools\b/gi, "Elige un tipo de herramientas de artesano");
      body = body.replace(/\bChoose one kind of Gaming Set\b/gi, "Elige un juego de mesa");
      body = body.replace(/\bChoose one kind of Musical Instrument\b/gi, "Elige un instrumento musical");
      body = body.replace(/\bChoose A or B\b/gi, "elige A o B");
      body = body.replace(/\b\(same as above\)/gi, "(el mismo que arriba)");
      body = body.replace(/\b\(any\)/gi, "(cualquiera)");
      body = body.replace(/\bGP\b/g, "PO");
      for (const [en, es] of Object.entries(FEAT_NAME_ES)) {
        body = body.replace(new RegExp(`\\b${en}\\b`, "g"), es);
      }
      body = body
        .replace(/\bCleric\b/g, "Clérigo")
        .replace(/\bWizard\b/g, "Mago")
        .replace(/\bDruid\b/g, "Druida")
        .replace(/\bCalligrapher's Supplies\b/gi, "útiles de calígrafo")
        .replace(/\bThieves' Tools\b/gi, "herramientas de ladrón")
        .replace(/\bForgery Kit\b/gi, "kit de falsificación")
        .replace(/\bCarpenter's Tools\b/gi, "herramientas de carpintero")
        .replace(/\bCartographer's Tools\b/gi, "herramientas de cartógrafo")
        .replace(/\bHerbalism Kit\b/gi, "kit de herboristería")
        .replace(/\bNavigator's Tools\b/gi, "herramientas de navegante")
        .replace(/\bHealer's Kit\b/gi, "kit de sanador")
        .replace(/\bTraveler's Clothes\b/gi, "ropa de viajero")
        .replace(/\bFine Clothes\b/gi, "ropa fina")
        .replace(/\bHoly Symbol\b/gi, "símbolo sagrado")
        .replace(/\bLight Crossbow\b/gi, "ballesta ligera")
        .replace(/\bHooded Lantern\b/gi, "linterna con capucha")
        .replace(/\bGaming Set\b/gi, "juego de mesa")
        .replace(/\bMusical Instrument\b/gi, "instrumento musical")
        .replace(/\bArtisan's Tools\b/gi, "herramientas de artesano");
      if (key === "Skill Proficiencies") {
        return `Pericias: ${body}`;
      }
      if (key === "Tool Proficiency") {
        return `Herramienta: ${body}`;
      }
      return `${labelEs[key] ?? key}: ${traducirTextoDnD(body)}`;
    })
    .join("\n")
    .replace(/Pericias::/g, "Pericias:")
    .replace(/Competencias en pericias::/g, "Pericias:")
    .replace(/Competencia con herramientas::/g, "Herramienta:");
}

type SubclassFeature = { level: number; name: string; description: string };

function buildSubclassFeatures(): void {
  const manualPath = path.join(root, "data/i18n/subclass-features-manual.json");
  const manualByKey = fs.existsSync(manualPath)
    ? loadJson<Record<string, { name?: string; description: string }>>(manualPath)
    : {};

  const pack = loadJson<{
    subclasses: { id: string; nameEn: string; classId: string }[];
  }>(packPath);
  const classesTr = loadTranslate("dnd5e.classes24.json");
  const entries = classesTr.entries ?? {};
  const classFiles = fs
    .readdirSync(path.join(dataRoot, "class"))
    .filter((f) => f.startsWith("class-") && f.endsWith(".json"));

  const featuresBySubclass: Record<string, SubclassFeature[]> = {};

  for (const file of classFiles) {
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
      const subclassId = toId(feat.subclassShortName ?? "");
      if (!subclassId) continue;
      if (/^(Path of|College of|Domain of|Oath of|Circle of|Primal Path|Druid Circle)/i.test(feat.name)) {
        continue;
      }

      const classId = toId(feat.className ?? "");
      const list = featuresBySubclass[subclassId] ?? [];
      const manualKey = `${subclassId}::${feat.level}::${feat.name}`;
      const manualEntry = manualByKey[manualKey];
      const fromFoundry = manualEntry
        ? undefined
        : matchFoundryFeature(classId, feat.name, entries);

      const nameEs = manualEntry?.name ?? fromFoundry?.name ?? traducirTextoDnD(feat.name);

      const descEn = cleanFiveText(flattenEntries(feat.entries));
      const description = sanitizarTerminosFoundryEs(
        manualEntry?.description ??
          (fromFoundry?.description
            ? htmlFoundryAPlano(fromFoundry.description)
            : traducirTextoDnD(descEn)),
      );

      list.push({ level: feat.level, name: nameEs, description });
      featuresBySubclass[subclassId] = list;
    }
  }

  for (const sc of pack.subclasses) {
    featuresBySubclass[sc.id] ??= [];
  }

  for (const list of Object.values(featuresBySubclass)) {
    list.sort((a, b) => a.level - b.level);
  }

  writeJson(path.join(root, "src/data/srd/subclass-feature-meta.json"), featuresBySubclass);
  console.log(
    `subclass-feature-meta: ${Object.keys(featuresBySubclass).length} subclases`,
  );
}

function main() {
  if (!fs.existsSync(packPath)) {
    console.error("No se encontró xphb-pack.json. Ejecuta: npm run build:content-pack");
    process.exit(1);
  }

  buildSpellNames();
  buildSpellDescriptions();
  buildFeatDescriptions();
  buildBackgroundDescriptions();
  buildSubclassFeatures();
  console.log("PHB i18n ES generado.");
}

main();
