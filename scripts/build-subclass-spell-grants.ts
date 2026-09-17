/**
 * Genera src/data/srd/subclass-spell-grants.json desde additionalSpells XPHB.
 * Requiere vendor/5etools-src/data/class/class-*.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentPackPaths, idSubclaseCanonico, toId } from "./i18n-shared.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const classDir = path.join(root, "vendor", "5etools-src", "data", "class");
const outPath = path.join(root, "src", "data", "srd", "subclass-spell-grants.json");
const srdSpellsPath = path.join(root, "src", "data", "srd", "spells.json");
const packPaths = contentPackPaths();

const ABILITY_CLASE: Record<string, string> = {
  barbarian: "wis",
  bard: "cha",
  cleric: "wis",
  druid: "wis",
  fighter: "int",
  monk: "wis",
  paladin: "cha",
  ranger: "wis",
  rogue: "int",
  sorcerer: "cha",
  warlock: "cha",
  wizard: "int",
};

type Grant = {
  grantKey: string;
  spellId: string;
  level: number;
  minClassLevel: number;
  classId: string;
  alwaysPrepared: true;
  abilityKey: string;
  choiceKey?: string;
  choiceValue?: string;
};

function idSubclase(shortName: string | undefined, name: string): string {
  return idSubclaseCanonico(toId(shortName ?? name));
}

function spellRefToId(ref: string): string {
  const [name] = ref.split("|");
  return toId((name ?? ref).replace(/#.*$/, ""));
}

function isConcreteSpell(value: unknown): value is string {
  return typeof value === "string" && !value.includes("{") && !value.startsWith("level=");
}

function loadSpellLevels(): Map<string, number> {
  const byId = new Map<string, number>();
  const srd = JSON.parse(fs.readFileSync(srdSpellsPath, "utf8")) as {
    id: string;
    level: number;
  }[];
  for (const s of srd) byId.set(s.id, s.level);
  const packFile = packPaths.find((p) => fs.existsSync(p));
  if (packFile) {
    const pack = JSON.parse(fs.readFileSync(packFile, "utf8")) as {
      spells?: { id: string; level: number }[];
    };
    for (const s of pack.spells ?? []) {
      if (!byId.has(s.id)) byId.set(s.id, s.level);
    }
  }
  return byId;
}

function pushSpell(
  out: Grant[],
  seen: Set<string>,
  opts: {
    classId: string;
    subclassId: string;
    spellId: string;
    minClassLevel: number;
    levels: Map<string, number>;
    choiceKey?: string;
    choiceValue?: string;
  },
) {
  const key = `${opts.subclassId}:${opts.spellId}:${opts.minClassLevel}:${opts.choiceValue ?? ""}`;
  if (seen.has(key)) return;
  seen.add(key);
  const suffix = opts.choiceValue ? `-${opts.choiceValue}` : "";
  out.push({
    grantKey: `${opts.spellId}-${opts.minClassLevel}${suffix}`,
    spellId: opts.spellId,
    level: opts.levels.get(opts.spellId) ?? 1,
    minClassLevel: opts.minClassLevel,
    classId: opts.classId,
    alwaysPrepared: true,
    abilityKey: ABILITY_CLASE[opts.classId] ?? "cha",
    ...(opts.choiceKey && opts.choiceValue
      ? { choiceKey: opts.choiceKey, choiceValue: opts.choiceValue }
      : {}),
  });
}

function collectFromPrepared(
  out: Grant[],
  seen: Set<string>,
  prepared: Record<string, unknown> | undefined,
  ctx: {
    classId: string;
    subclassId: string;
    levels: Map<string, number>;
    choiceKey?: string;
    choiceValue?: string;
  },
) {
  if (!prepared) return;
  for (const [lvl, list] of Object.entries(prepared)) {
    const minClassLevel = Number(lvl);
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!isConcreteSpell(item)) continue;
      pushSpell(out, seen, {
        ...ctx,
        spellId: spellRefToId(item),
        minClassLevel,
      });
    }
  }
}

function collectFromInnate(
  out: Grant[],
  seen: Set<string>,
  innate: Record<string, unknown> | undefined,
  ctx: {
    classId: string;
    subclassId: string;
    levels: Map<string, number>;
  },
) {
  if (!innate) return;
  for (const [lvl, spec] of Object.entries(innate)) {
    const minClassLevel = Number(lvl);
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) continue;
    const block = spec as Record<string, unknown>;
    if ("resource" in block) continue;
    const refs: string[] = [];
    if (Array.isArray(block.ritual)) refs.push(...block.ritual.filter(isConcreteSpell));
    const daily = block.daily;
    if (daily && typeof daily === "object") {
      for (const list of Object.values(daily as Record<string, unknown>)) {
        if (Array.isArray(list)) refs.push(...list.filter(isConcreteSpell));
      }
    }
    for (const ref of refs) {
      pushSpell(out, seen, {
        ...ctx,
        spellId: spellRefToId(ref),
        minClassLevel,
      });
    }
  }
}

function main() {
  if (!fs.existsSync(classDir)) {
    console.error("Falta vendor/5etools-src/data/class. Ejecuta: npm run fetch:5etools");
    process.exit(1);
  }

  const levels = loadSpellLevels();
  const bySubclass: Record<string, Grant[]> = {};
  const seenBySubclass = new Map<string, Set<string>>();

  for (const file of fs.readdirSync(classDir).filter((f) => /^class-[a-z]+\.json$/.test(f))) {
    const data = JSON.parse(fs.readFileSync(path.join(classDir, file), "utf8")) as {
      subclass?: {
        source?: string;
        name?: string;
        shortName?: string;
        className?: string;
        additionalSpells?: Record<string, unknown>[];
      }[];
    };
    for (const sc of data.subclass ?? []) {
      if (sc.source !== "XPHB" || !sc.name || !sc.className) continue;
      const classId = toId(sc.className);
      const subclassId = idSubclase(sc.shortName, sc.name);
      const seen = seenBySubclass.get(subclassId) ?? new Set<string>();
      seenBySubclass.set(subclassId, seen);
      const out = (bySubclass[subclassId] ??= []);
      const ctx = { classId, subclassId, levels };

      for (const block of sc.additionalSpells ?? []) {
        const landName = typeof block.name === "string" ? block.name : null;
        const choiceValue = landName?.toLowerCase().endsWith(" land")
          ? toId(landName.replace(/\s+land$/i, ""))
          : undefined;
        collectFromPrepared(out, seen, block.prepared as Record<string, unknown> | undefined, {
          ...ctx,
          ...(choiceValue ? { choiceKey: "land-terrain", choiceValue } : {}),
        });
        collectFromPrepared(out, seen, block.known as Record<string, unknown> | undefined, ctx);
        collectFromInnate(out, seen, block.innate as Record<string, unknown> | undefined, ctx);
      }
    }
  }

  const sorted: Record<string, Grant[]> = {};
  for (const id of Object.keys(bySubclass).sort()) {
    const rows = bySubclass[id]!;
    if (rows.length === 0) continue;
    sorted[id] = rows.sort(
      (a, b) =>
        a.minClassLevel - b.minClassLevel ||
        a.spellId.localeCompare(b.spellId) ||
        (a.choiceValue ?? "").localeCompare(b.choiceValue ?? ""),
    );
  }

  fs.writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`);
  const n = Object.values(sorted).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`subclass-spell-grants.json: ${Object.keys(sorted).length} subclases, ${n} otorgamientos`);
}

main();
