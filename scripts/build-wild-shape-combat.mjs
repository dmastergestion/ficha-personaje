/**
 * Extrae CA / velocidad / FUE-DES-CON / ataques del SRD 5.2.1 (animals.md).
 * Uso: node scripts/build-wild-shape-combat.mjs <ruta-animals.md>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const beastsPath = path.join(root, "src/data/srd/wild-shape-beasts.json");
const combatPath = path.join(root, "src/data/srd/wild-shape-combat.json");

const TITLE_TO_ID = {
  Ape: "ape",
  Baboon: "baboon",
  Badger: "badger",
  Bat: "bat",
  "Black Bear": "black-bear",
  "Blood Hawk": "blood-hawk",
  Boar: "boar",
  "Brown Bear": "brown-bear",
  Camel: "camel",
  Cat: "cat",
  "Constrictor Snake": "constrictor-snake",
  Crab: "crab",
  Crocodile: "crocodile",
  Deer: "deer",
  "Dire Wolf": "dire-wolf",
  "Draft Horse": "draft-horse",
  Eagle: "eagle",
  Elk: "elk",
  "Flying Snake": "flying-snake",
  Frog: "frog",
  "Giant Badger": "giant-badger",
  "Giant Bat": "giant-bat",
  "Giant Crab": "giant-crab",
  "Giant Eagle": "giant-eagle",
  "Giant Frog": "giant-frog",
  "Giant Goat": "giant-goat",
  "Giant Hyena": "giant-hyena",
  "Giant Lizard": "giant-lizard",
  "Giant Octopus": "giant-octopus",
  "Giant Owl": "giant-owl",
  "Giant Rat": "giant-rat",
  "Giant Seahorse": "giant-sea-horse",
  "Giant Spider": "giant-spider",
  "Giant Toad": "giant-toad",
  "Giant Venomous Snake": "giant-poisonous-snake",
  "Giant Wasp": "giant-wasp",
  "Giant Weasel": "giant-weasel",
  "Giant Wolf Spider": "giant-wolf-spider",
  Goat: "goat",
  Hawk: "hawk",
  Hyena: "hyena",
  Jackal: "jackal",
  Lion: "lion",
  Lizard: "lizard",
  Mastiff: "mastiff",
  Mule: "mule",
  Octopus: "octopus",
  Owl: "owl",
  Panther: "panther",
  Piranha: "quipper",
  Pony: "pony",
  Pteranodon: "pteranodon",
  Rat: "rat",
  Raven: "raven",
  "Reef Shark": "reef-shark",
  "Riding Horse": "riding-horse",
  Scorpion: "scorpion",
  Seahorse: "sea-horse",
  Spider: "spider",
  Tiger: "tiger",
  "Venomous Snake": "poisonous-snake",
  Vulture: "vulture",
  Warhorse: "warhorse",
  Weasel: "weasel",
  Wolf: "wolf",
};

const ATTACK_ES = {
  Bite: "Mordisco",
  Beak: "Pico",
  Claw: "Garra",
  Claws: "Garras",
  Fist: "Puño",
  Rock: "Roca",
  Hooves: "Cascos",
  Hoof: "Casco",
  Talons: "Garras",
  Gore: "Cornamenta",
  Tusk: "Colmillo",
  Tusks: "Colmillos",
  Sting: "Aguijón",
  Slam: "Golpe",
  Tentacle: "Tentáculo",
  Tentacles: "Tentáculos",
  Constrict: "Constricción",
  Kick: "Patada",
  Ram: "Embestida",
  Peck: "Picotazo",
  Swallow: "Tragar",
  "Blood Drain": "Drenar sangre",
  Rend: "Desgarrar",
  Tail: "Cola",
};

const DAMAGE_ES = {
  Piercing: "perforante",
  Slashing: "cortante",
  Bludgeoning: "contundente",
  Poison: "veneno",
  Fire: "fuego",
  Cold: "frío",
  Lightning: "eléctrico",
  Acid: "ácido",
  Thunder: "trueno",
  Necrotic: "necrótico",
  Radiant: "radiante",
  Psychic: "psíquico",
  Force: "fuerza",
};

function parseCr(raw) {
  const m = /\*\*CR\*\*\s+([0-9/]+)/.exec(raw);
  if (!m) return null;
  const t = m[1];
  if (t.includes("/")) {
    const [a, b] = t.split("/").map(Number);
    return a / b;
  }
  return Number(t);
}

function parseSpeed(raw) {
  const line = /\*\*Speed\*\*\s+([^\n<]+)/.exec(raw)?.[1] ?? "";
  const walk = /(\d+)\s*ft/.exec(line);
  const notes = [];
  for (const [en, es] of [
    ["Fly", "Vuelo"],
    ["Climb", "Trepar"],
    ["Swim", "Nadar"],
    ["Burrow", "Excavar"],
  ]) {
    const m = new RegExp(`${en}\\s+(\\d+)\\s*ft`, "i").exec(line);
    if (m) notes.push(`${es} ${m[1]} pies`);
  }
  return { speed: walk ? Number(walk[1]) : 0, speedNotes: notes };
}

function parseScore(raw, key) {
  const re = new RegExp(`<strong>${key}</strong></td>\\s*<td>(-?\\d+)</td>`, "i");
  const m = re.exec(raw);
  return m ? Number(m[1]) : null;
}

function traduceAtaque(name) {
  const clean = name.replace(/\s*\(.*\)\s*$/, "").trim();
  return ATTACK_ES[clean] ?? clean;
}

function parseAttacks(section) {
  const actions = section.split(/### Actions/)[1]?.split(/### /)[0] ?? "";
  const attacks = [];
  const notes = [];
  if (/\*\*_Multiattack\._\*/i.test(actions)) notes.push("Ataque múltiple");
  const re =
    /\*\*_([^.*]+?)\._\*\*\s*_((?:Melee|Ranged) Attack Roll):_\s*\+(\d+)[\s\S]*?_Hit:_\s*(?:(\d+)\s*\(([^)]+)\)|(\d+))\s+([A-Za-z]+)/g;
  let m;
  while ((m = re.exec(actions))) {
    const nameEn = m[1].trim();
    const toHit = Number(m[3]);
    const dice = (m[5] ?? m[6] ?? "").replace(/\s+/g, "").replace(/−/g, "-");
    const typeEs = DAMAGE_ES[m[7]] ?? m[7].toLowerCase();
    attacks.push({
      nameEs: traduceAtaque(nameEn),
      toHit,
      damage: `${dice} ${typeEs}`.trim(),
    });
  }
  if (attacks.length === 0 && /### Actions/.test(section)) {
    notes.push("Sin ataque ofensivo");
  }
  return { attacks, extraNotes: notes };
}

function parseAnimals(md) {
  const parts = md.split(/^## /m).slice(1);
  const byId = {};
  for (const part of parts) {
    const title = part.split(/\n/, 1)[0].trim();
    const id = TITLE_TO_ID[title];
    if (!id) continue;
    const ac = Number(/\*\*AC\*\*\s+(\d+)/.exec(part)?.[1] ?? 0);
    const { speed, speedNotes } = parseSpeed(part);
    const str = parseScore(part, "STR");
    const dex = parseScore(part, "DEX");
    const con = parseScore(part, "CON");
    const cr = parseCr(part);
    const { attacks, extraNotes } = parseAttacks(part);
    const notes = [...speedNotes, ...extraNotes];
    if (/\*\*_Pack Tactics\._\*/i.test(part)) notes.push("Tácticas de manada");
    byId[id] = {
      cr,
      combat: {
        ac,
        speed,
        str,
        dex,
        con,
        attacks,
        ...(notes.length ? { notes: notes.join("; ") } : {}),
      },
    };
  }
  return byId;
}

const mdPath = process.argv[2];
if (!mdPath) {
  console.error("Uso: node scripts/build-wild-shape-combat.mjs <animals.md>");
  process.exit(1);
}

const parsed = parseAnimals(fs.readFileSync(mdPath, "utf8"));
const beasts = JSON.parse(fs.readFileSync(beastsPath, "utf8"));
const combat = {};
const missing = [];
const crChanges = [];

for (const beast of beasts) {
  const row = parsed[beast.id];
  if (!row) {
    missing.push(beast.id);
    continue;
  }
  if (row.cr != null && row.cr !== beast.cr) {
    crChanges.push(`${beast.id}: ${beast.cr} → ${row.cr}`);
    beast.cr = row.cr;
  }
  if (row.combat.str == null) {
    missing.push(`${beast.id} (bloque incompleto)`);
    continue;
  }
  combat[beast.id] = row.combat;
}

fs.writeFileSync(beastsPath, `${JSON.stringify(beasts, null, 2)}\n`);
fs.writeFileSync(combatPath, `${JSON.stringify(combat, null, 2)}\n`);
console.log(`Bloques: ${Object.keys(combat).length}`);
console.log(`CR actualizados: ${crChanges.length ? crChanges.join("; ") : "ninguno"}`);
console.log(`Sin SRD: ${missing.length ? missing.join(", ") : "ninguno"}`);
