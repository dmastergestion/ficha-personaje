/** Empareja rasgos de clase/subclase de 5etools con entradas Foundry (español). */

export const CLASS_PREFIX: Record<string, string> = {
  barbarian: "phbbrb",
  bard: "phbbrd",
  cleric: "phbclc",
  druid: "phbdrd",
  fighter: "phbftr",
  monk: "phbmnk",
  paladin: "phbpln",
  ranger: "phbrgr",
  rogue: "phbrge",
  sorcerer: "phbscr",
  warlock: "phbwlk",
  wizard: "phbwiz",
};

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function foundryKeyToTerms(key: string): string {
  return key
    .replace(/^phb[a-z]{3}/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase();
}

function overlapScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  const aw = a.match(/[a-z]+/g) ?? [];
  const bw = b.match(/[a-z]+/g) ?? [];
  let score = 0;
  for (const w of aw) {
    if (w.length < 3) continue;
    if (bw.some((x) => x === w || x.startsWith(w) || w.startsWith(x))) score++;
  }
  return score;
}

export function matchFoundryFeature(
  classId: string,
  featureNameEn: string,
  entries: Record<string, { name?: string; description?: string }>,
): { name?: string; description?: string } | undefined {
  const prefix = CLASS_PREFIX[classId];
  if (!prefix) return undefined;

  const target = norm(featureNameEn);
  let best: { name?: string; description?: string } | undefined;
  let bestScore = 0;

  for (const [key, entry] of Object.entries(entries)) {
    if (!key.startsWith(prefix) || !entry.description) continue;

    const terms = norm(foundryKeyToTerms(key));
    const nameNorm = entry.name ? norm(entry.name) : "";

    const scores = [
      terms === target ? 100 : 0,
      nameNorm === target ? 100 : 0,
      overlapScore(target, terms),
      overlapScore(target, nameNorm),
    ];
    const score = Math.max(...scores);

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= 60 ? best : undefined;
}

export function indexFoundryByEnglishName(
  entries: Record<string, { name?: string; description?: string }> | undefined,
): Map<string, { name?: string; description?: string }> {
  const map = new Map<string, { name?: string; description?: string }>();
  for (const [key, entry] of Object.entries(entries ?? {})) {
    if (!entry.description) continue;
    const terms = foundryKeyToTerms(key);
    map.set(norm(terms), entry);
    if (entry.name) map.set(norm(entry.name), entry);
  }
  return map;
}
