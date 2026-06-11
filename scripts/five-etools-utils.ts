/** Utilidades compartidas para extraer datos legibles desde JSON de 5etools. */
import { piesAMetrosTexto } from "../src/lib/rules-text-polish.js";

export interface FiveSpellLike {
  name?: string;
  time?: { number?: number; unit?: string }[];
  range?: {
    type?: string;
    distance?: { type?: string; amount?: number };
  };
  components?: {
    v?: boolean;
    s?: boolean;
    m?: boolean | string | { text?: string; cost?: number };
  };
  duration?: {
    type?: string;
    duration?: { type?: string; amount?: number };
    concentration?: boolean;
    ends?: string[];
  }[];
  miscTags?: string[];
  ritual?: boolean;
  entries?: unknown;
  entriesHigherLevel?: unknown;
  areaTags?: string[];
  spellAttack?: string[];
  savingThrow?: string[];
  damageInflict?: string[];
  scalingLevelDice?: { label?: string; scaling?: Record<string, string> };
  level?: number;
}

const TIME_UNIT_ES: Record<string, string> = {
  action: "acción",
  bonus: "acción adicional",
  reaction: "reacción",
  minute: "minuto",
  minutes: "minutos",
  hour: "hora",
  hours: "horas",
  round: "asalto",
  rounds: "asaltos",
  day: "día",
  days: "días",
};

const DURATION_UNIT_ES: Record<string, string> = {
  round: "asalto",
  rounds: "asaltos",
  minute: "minuto",
  minutes: "minutos",
  hour: "hora",
  hours: "horas",
  day: "día",
  days: "días",
};

const AREA_TAG_ES: Record<string, string> = {
  S: "Esfera",
  N: "Cono",
  C: "Cilindro",
  L: "Línea",
  R: "Radio",
  Q: "Cubo",
  H: "Hemisferio",
  W: "Muro",
  MT: "Varios objetivos",
  ST: "Un objetivo",
  SGT: "Una criatura",
  SCT: "Varias criaturas",
};

const SIZE_ES: Record<string, string> = {
  T: "Diminuto",
  S: "Pequeño",
  M: "Mediano",
  L: "Grande",
  H: "Enorme",
  G: "Gigante",
};

export function cleanFiveText(text: string): string {
  return text
    .replace(/\{@damage\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@dice\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@variantrule\s+([^|]+)\|[^|]*\|([^}]+)\}/gi, "$2")
    .replace(/\{@variantrule\s+([^}]+)\}/gi, "$1")
    .replace(/\{@sense\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@item\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@spell\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@condition\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@hazard\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@skill\s+([^}|]+)(?:\|[^}]*)?\}/gi, "$1")
    .replace(/\{@scaledamage[^}]*\}/gi, "")
    .replace(/\{@scaledice[^}]*\}/gi, "")
    .replace(/\{@filter[^}]*\}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function flattenEntries(entries: unknown, depth = 0): string {
  if (!entries) return "";
  if (typeof entries === "string") return cleanFiveText(entries);
  if (Array.isArray(entries)) {
    return entries
      .map((e) => flattenEntries(e, depth + 1))
      .filter(Boolean)
      .join(depth === 0 ? "\n\n" : " ");
  }
  if (typeof entries === "object" && entries !== null) {
    const obj = entries as Record<string, unknown>;
    const name = typeof obj.name === "string" ? `${obj.name}: ` : "";
    const body = flattenEntries(obj.entries ?? obj.entry ?? obj.items, depth + 1);
    return name + body;
  }
  return "";
}

export function formatCastingTime(
  time: FiveSpellLike["time"],
): string | undefined {
  if (!time?.length) return undefined;
  const parts = time.map((t) => {
    const n = t.number ?? 1;
    const unit = TIME_UNIT_ES[t.unit ?? ""] ?? t.unit ?? "";
    if (t.unit === "minute" || t.unit === "hour") {
      return n === 1 ? `1 ${unit}` : `${n} ${unit}s`;
    }
    return n === 1 ? `1 ${unit}` : `${n} ${unit}`;
  });
  return parts.join(", ");
}

export function formatRange(range: FiveSpellLike["range"]): string | undefined {
  if (!range) return undefined;
  const type = range.type ?? "";
  const distType = range.distance?.type ?? "";
  const amount = range.distance?.amount;

  const labels: Record<string, string> = {
    touch: "Toque",
    self: "Personal",
    sight: "Vista",
    special: "Especial",
    unlimited: "Ilimitado",
  };

  if (labels[type]) return labels[type];
  if (distType && labels[distType]) return labels[distType];

  if (distType === "mile" && amount != null) {
    return amount === 1 ? "1 milla" : `${amount} millas`;
  }

  if (distType === "feet" && amount != null) {
    return `${piesAMetrosTexto(amount)} metros`;
  }

  if (type === "point" && amount != null && distType === "feet") {
    return `${piesAMetrosTexto(amount)} metros`;
  }

  if (amount != null && distType) {
    if (distType === "feet") return `${piesAMetrosTexto(amount)} metros`;
    return `${amount} ${distType}`.trim();
  }

  return undefined;
}

export function formatComponents(
  components: FiveSpellLike["components"],
): string | undefined {
  if (!components) return undefined;
  const parts: string[] = [];
  if (components.v) parts.push("V");
  if (components.s) parts.push("S");
  if (components.m) {
    if (typeof components.m === "object" && components.m !== null && "text" in components.m) {
      parts.push(`M (${components.m.text})`);
    } else if (typeof components.m === "string") {
      parts.push(`M (${components.m})`);
    } else {
      parts.push("M");
    }
  }
  return parts.length ? parts.join(", ") : undefined;
}

export function formatDuration(
  duration: FiveSpellLike["duration"],
): string | undefined {
  if (!duration?.length) return undefined;
  const parts = duration.map((d) => {
    if (d.type === "instant") return "Instantáneo";
    if (d.type === "permanent") return "Permanente";
    if (d.type === "special") return "Especial";
    if (d.ends?.includes("dispel")) return "Hasta disipar";
    if (d.type === "timed" && d.duration) {
      const n = d.duration.amount ?? 1;
      const unit = DURATION_UNIT_ES[d.duration.type ?? ""] ?? d.duration.type ?? "";
      const span = n === 1 ? `1 ${unit}` : `${n} ${unit}s`;
      if (d.concentration) return `Concentración, hasta ${span}`;
      return span;
    }
    return d.type ?? "";
  });
  return parts.filter(Boolean).join("; ") || undefined;
}

export function isRitualSpell(entry: FiveSpellLike): boolean {
  if (entry.ritual === true) return true;
  if (entry.miscTags?.includes("RIT")) return true;
  return (entry.time ?? []).some((t) => t.unit === "ritual");
}

export function formatAreaTags(tags: string[] | undefined): string[] | undefined {
  if (!tags?.length) return undefined;
  return tags.map((t) => AREA_TAG_ES[t] ?? t);
}

export function extractSpellDetails(entry: FiveSpellLike): {
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  ritual: boolean;
  description?: string;
  areaTags?: string[];
} {
  const main = flattenEntries(entry.entries);
  const higher = flattenEntries(entry.entriesHigherLevel);
  const description = [main, higher].filter(Boolean).join("\n\n") || undefined;

  return {
    castingTime: formatCastingTime(entry.time),
    range: formatRange(entry.range),
    components: formatComponents(entry.components),
    duration: formatDuration(entry.duration),
    ritual: isRitualSpell(entry),
    description,
    areaTags: formatAreaTags(entry.areaTags),
  };
}

export function parseProficiencyBlocks(blocks: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(blocks)) return out;

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    for (const [key, val] of Object.entries(block as Record<string, unknown>)) {
      if (key === "choose" && val && typeof val === "object") {
        const choose = val as {
          from?: string[];
          weighted?: { from?: string[] };
        };
        const from = choose.from ?? choose.weighted?.from;
        if (from?.length) out.push(`Elegir: ${from.join(", ")}`);
        continue;
      }
      if (val === true) out.push(key.replace(/\|.*$/, ""));
    }
  }
  return out;
}

export function formatSize(size: string[] | string | undefined): string | undefined {
  if (!size) return undefined;
  const codes = Array.isArray(size) ? size : [size];
  const labels = [...new Set(codes.map((code) => (code ? (SIZE_ES[code] ?? code) : "")).filter(Boolean))];
  if (!labels.length) return undefined;
  return labels.join(" o ");
}

export function extractSpeciesDetails(entry: {
  size?: string[] | string;
  speed?: number;
  skillProficiencies?: unknown;
  entries?: unknown;
  _versions?: { entries?: unknown; name?: string }[];
}): {
  size?: string;
  speed?: number;
  skillProficiencies?: string[];
  traits?: string;
} {
  const traits = flattenEntries(entry.entries);
  return {
    size: formatSize(entry.size),
    speed: typeof entry.speed === "number" ? entry.speed : undefined,
    skillProficiencies: parseProficiencyBlocks(entry.skillProficiencies),
    traits: traits || undefined,
  };
}

const FEAT_CATEGORY: Record<string, string> = {
  G: "general",
  O: "origin",
  FS: "fighting-style",
  "FS:P": "fighting-style",
  "FS:R": "fighting-style",
  EB: "epic-boon",
};

export function formatFeatPrerequisite(prerequisite: unknown): string | undefined {
  if (!Array.isArray(prerequisite) || prerequisite.length === 0) return undefined;
  const parts: string[] = [];

  for (const req of prerequisite) {
    if (!req || typeof req !== "object") continue;
    const row = req as Record<string, unknown>;
    if (typeof row.level === "number") parts.push(`Nivel ${row.level}+`);
    if (typeof row.ability === "object" && row.ability) {
      const ab = row.ability as { choose?: { from?: string[]; amount?: number } };
      const from = ab.choose?.from?.join("/") ?? "";
      if (from) parts.push(`Atributo ${from}`);
    }
    if (Array.isArray(row.spell)) parts.push("Conjuro específico");
    if (typeof row.proficiency === "string") parts.push(`Competencia: ${row.proficiency}`);
    if (typeof row.feature === "string") parts.push(`Rasgo: ${row.feature}`);
  }

  return parts.length ? parts.join(" · ") : undefined;
}

export function extractFeatDetails(entry: {
  name?: string;
  category?: string;
  entries?: unknown;
  prerequisite?: unknown;
  repeatable?: boolean;
  srd52?: boolean;
}): {
  nameEn: string;
  category: string;
  description?: string;
  prerequisite?: string;
  repeatable?: boolean;
  srd52?: boolean;
} {
  return {
    nameEn: entry.name ?? "",
    category: FEAT_CATEGORY[entry.category ?? ""] ?? "general",
    description: flattenEntries(entry.entries) || undefined,
    prerequisite: formatFeatPrerequisite(entry.prerequisite),
    repeatable: entry.repeatable === true,
    srd52: entry.srd52 === true,
  };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractBackgroundDetails(entry: {
  skillProficiencies?: unknown;
  toolProficiencies?: unknown;
  feats?: Record<string, boolean>[];
  entries?: unknown;
}): {
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  feat?: string;
  traits?: string;
} {
  const feat =
    entry.feats
      ?.map((f) => Object.keys(f).find((k) => f[k]))
      .find(Boolean)
      ?.replace(/\|.*$/, "")
      ?.replace(/;/g, " — ") ?? undefined;

  return {
    skillProficiencies: parseProficiencyBlocks(entry.skillProficiencies),
    toolProficiencies: parseProficiencyBlocks(entry.toolProficiencies),
    feat,
    traits: flattenEntries(entry.entries) || undefined,
  };
}
