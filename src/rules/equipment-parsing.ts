import { etiquetaHerramienta } from "@/lib/origin-text";
import type { OriginChoices } from "@/rules/origin-choices";
import { srdArmor, srdWeapons, t, type SrdWeapon } from "@/rules/srd";
import type { EquipmentItem } from "@/schemas/character";

const GAMING_SET_LABELS: Record<string, string> = {
  dice: "Juego de dados",
  "playing-cards": "Baraja de cartas",
  dragonchess: "Dragajedrez",
  "three-dragon-ante": "Tres dragones al ante",
};

const MUSICAL_INSTRUMENT_LABELS: Record<string, string> = {
  bagpipes: "Gaita",
  drum: "Tambor",
  dulcimer: "Dulcémele",
  flute: "Flauta",
  lute: "Laúd",
  lyre: "Lira",
  horn: "Cuerno",
  "pan-flute": "Flauta de pan",
  shawm: "Chirimía",
  viol: "Viola",
};

const ARTISAN_TOOL_VALUES = new Set([
  "alchemist's supplies",
  "brewer's supplies",
  "calligrapher's supplies",
  "carpenter's tools",
  "cartographer's tools",
  "cobbler's tools",
  "cook's utensils",
  "glassblower's tools",
  "jeweler's tools",
  "leatherworker's tools",
  "mason's tools",
  "painter's supplies",
  "potter's tools",
  "smith's tools",
  "tinker's tools",
  "weaver's tools",
  "woodcarver's tools",
]);

export const GEAR_LABELS_ES: Record<string, string> = {
  arrow: "Flecha",
  bolt: "Virola",
  bedroll: "Saco de dormir",
  book: "Libro",
  "burglar's pack": "Mochila de ladrón",
  costume: "Disfraz",
  crowbar: "Palanca",
  "dungeoneer's pack": "Mochila de calabozo",
  "entertainer's pack": "Mochila de artista",
  "explorer's pack": "Mochila de explorador",
  "fine clothes": "Ropa fina",
  "forgery kit": "Kit de falsificación",
  "healer's kit": "Kit de sanador",
  "herbalism kit": "Kit de herboristería",
  "hooded lantern": "Linterna con capucha",
  "holy symbol": "Símbolo sagrado",
  "iron pot": "Olla de hierro",
  lamp: "Lámpara",
  manacles: "Grilletes",
  mirror: "Espejo",
  "musical instrument": "Instrumento musical",
  oil: "Aceite",
  parchment: "Pergamino",
  perfume: "Perfume",
  pouch: "Bolsa",
  "priest's pack": "Mochila de sacerdote",
  quiver: "Carcaj",
  robe: "Túnica",
  rope: "Cuerda",
  "scholar's pack": "Mochila de erudito",
  shovel: "Pala",
  spellbook: "Libro de conjuros",
  tent: "Tienda",
  "thieves' tools": "Herramientas de ladrón",
  "traveler's clothes": "Ropa de viajero",
};

const weaponByNameEn = new Map<string, SrdWeapon>(
  srdWeapons.map((weapon) => [weapon.nameEn.toLowerCase(), weapon]),
);

const armorByNameEn = new Map<string, string>(
  srdArmor.map((armor) => [armor.nameEn.toLowerCase(), armor.id]),
);

const PLURAL_WEAPON: Record<string, string> = {
  handaxes: "handaxe",
  javelins: "javelin",
  daggers: "dagger",
  arrows: "arrow",
  bolts: "bolt",
};

export interface PaqueteEquipoParseado {
  items: EquipmentItem[];
  gp: number;
  armorId: string | null;
  shieldEquipped: boolean;
}

export function dividirTokensEquipo(raw: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of raw) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function normalizarNombreArma(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return PLURAL_WEAPON[lower] ?? lower.replace(/s$/, "");
}

export function weaponIdDesdeNombre(raw: string): string | null {
  const trimmed = normalizarNombreArma(raw);
  const byName = weaponByNameEn.get(trimmed);
  if (byName) return byName.id;
  const slug = trimmed.replace(/\s+/g, "-");
  return srdWeapons.some((weapon) => weapon.id === slug) ? slug : null;
}

export function armorIdDesdeNombre(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  if (lower === "shield") return null;
  return armorByNameEn.get(lower) ?? null;
}

function itemDesdeArma(weapon: SrdWeapon, qty: number, note: string): EquipmentItem {
  return {
    id: crypto.randomUUID(),
    name: t("weapons", weapon.id, weapon.nameEn),
    qty,
    weightLb: weapon.weightLb,
    weaponId: weapon.id,
    notes: note,
  };
}

function etiquetaEquipoGenerico(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return GEAR_LABELS_ES[lower] ?? raw.trim();
}

function resolverReferenciaEquipo(token: string, choices: OriginChoices): string {
  const lower = token.toLowerCase();
  if (lower.includes("(same as above)")) {
    const tool = choices.background.tool;
    if (lower.includes("artisan") && tool && ARTISAN_TOOL_VALUES.has(tool)) {
      return etiquetaHerramienta(tool);
    }
    if (lower.includes("musical instrument") && tool) {
      return MUSICAL_INSTRUMENT_LABELS[tool] ?? "Instrumento musical";
    }
    if (lower.includes("gaming set")) {
      if (lower.includes("(any)")) return "Juego de mesa";
      if (tool) return GAMING_SET_LABELS[tool] ?? "Juego de mesa";
    }
    return token.replace(/\s*\(same as above\)/i, "").trim();
  }
  if (lower.includes("gaming set (any)")) return "Juego de mesa";
  return token.trim();
}

function crearItemGenerico(name: string, qty: number, note: string): EquipmentItem {
  return {
    id: crypto.randomUUID(),
    name,
    qty,
    weightLb: 0,
    notes: note,
  };
}

function esNombreHerramienta(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("tools") ||
    lower.includes("supplies") ||
    lower.includes(" kit") ||
    lower.endsWith(" kit") ||
    lower.includes("utensils") ||
    lower.includes("instrument")
  );
}

function extraerArmaDeEnfoque(label: string): string | null {
  const focus = label.match(/(?:arcane|druidic)\s+focus\s*\(([^)]+)\)/i);
  if (!focus) return null;
  const inner = focus[1]!.trim().toLowerCase();
  if (inner.includes("quarterstaff")) return "quarterstaff";
  return null;
}

function parsearTokenIndividual(
  token: string,
  choices: OriginChoices,
  note: string,
): { item: EquipmentItem | null; armorId: string | null; shield: boolean; gp: number } {
  const resolved = resolverReferenciaEquipo(token, choices);
  if (!resolved) return { item: null, armorId: null, shield: false, gp: 0 };

  const gpOnly = resolved.match(/^(\d+)\s*GP$/i);
  if (gpOnly) return { item: null, armorId: null, shield: false, gp: Number(gpOnly[1]) };

  if (/^shield$/i.test(resolved.trim())) {
    return { item: null, armorId: null, shield: true, gp: 0 };
  }

  const armorId = armorIdDesdeNombre(resolved);
  if (armorId) {
    return { item: null, armorId, shield: false, gp: 0 };
  }

  let qty = 1;
  let label = resolved;

  const qtyPrefix = resolved.match(/^(\d+)\s+(.+)$/);
  if (qtyPrefix) {
    qty = Number(qtyPrefix[1]);
    label = qtyPrefix[2]!.trim();
  }

  const focusWeapon = extraerArmaDeEnfoque(label);
  if (focusWeapon) {
    const weapon = srdWeapons.find((w) => w.id === focusWeapon);
    if (weapon) {
      return {
        item: itemDesdeArma(weapon, qty, note),
        armorId: null,
        shield: false,
        gp: 0,
      };
    }
  }

  const qtySuffix = label.match(/^(.+?)\s+\((\d+)\s+([^)]+)\)$/i);
  if (qtySuffix) {
    const base = qtySuffix[1]!.trim();
    const count = Number(qtySuffix[2]);
    const unit = qtySuffix[3]!.trim();
    qty = count;
    label = `${etiquetaEquipoGenerico(base)} (${count} ${unit})`;
  } else if (label.match(/\([^)]+\)$/)) {
    const paren = label.match(/^(.+?)\s+(\(.+\))$/);
    if (paren) {
      label = `${etiquetaEquipoGenerico(paren[1]!.trim())} ${paren[2]}`;
    }
  } else {
    label = esNombreHerramienta(label) ? etiquetaHerramienta(label) : etiquetaEquipoGenerico(label);
  }

  const weaponBase = label.split("(")[0]!.trim();
  const weaponId = weaponIdDesdeNombre(weaponBase);
  if (weaponId) {
    const weapon =
      weaponByNameEn.get(normalizarNombreArma(weaponBase)) ??
      srdWeapons.find((w) => w.id === weaponId);
    if (weapon) {
      return { item: itemDesdeArma(weapon, qty, note), armorId: null, shield: false, gp: 0 };
    }
  }

  return {
    item: crearItemGenerico(label, qty, note),
    armorId: null,
    shield: false,
    gp: 0,
  };
}

export function parsearSegmentoEquipo(
  segment: string,
  originChoices: OriginChoices,
  note: string,
): PaqueteEquipoParseado {
  const trimmed = segment.trim();
  const gpSolo = trimmed.match(/^(\d+)\s*GP$/i);
  if (gpSolo) {
    return { items: [], gp: Number(gpSolo[1]), armorId: null, shieldEquipped: false };
  }

  const tokens = dividirTokensEquipo(trimmed);
  const items: EquipmentItem[] = [];
  let gp = 0;
  let armorId: string | null = null;
  let shieldEquipped = false;

  for (const token of tokens) {
    const parsed = parsearTokenIndividual(token, originChoices, note);
    gp += parsed.gp;
    if (parsed.armorId) armorId = parsed.armorId;
    if (parsed.shield) shieldEquipped = true;
    if (parsed.item) items.push(parsed.item);
  }

  return { items, gp, armorId, shieldEquipped };
}

export function extraerSegmentoEquipoTrasfondo(
  traits: string | undefined,
  choice: "A" | "B",
): string | null {
  if (!traits) return null;
  const match = traits.match(/Equipment::\s*Choose A or B:\s*\(A\)\s*([^;]+);\s*or\s*\(B\)\s*([^]+)$/i);
  if (!match) return null;
  return choice === "A" ? match[1]!.trim() : match[2]!.trim();
}
