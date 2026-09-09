/**
 * El SRD 2024 usa slugs cortos; el pack PHB usa el nombre con autor.
 * Son el mismo conjuro (p. ej. hideous-laughter ≡ tashas-hideous-laughter).
 */
export const ID_CONJURO_SRD_A_PACK: Readonly<Record<string, string>> = {
  "hideous-laughter": "tashas-hideous-laughter",
  "acid-arrow": "melfs-acid-arrow",
  "arcanists-magic-aura": "nystuls-magic-aura",
  "arcane-hand": "bigbys-hand",
  "tiny-hut": "leomunds-tiny-hut",
  "black-tentacles": "evards-black-tentacles",
  "faithful-hound": "mordenkainens-faithful-hound",
  "private-sanctum": "mordenkainens-private-sanctum",
  "resilient-sphere": "otilukes-resilient-sphere",
  "secret-chest": "leomunds-secret-chest",
  "magic-mouth": "arcane-mouth",
  "instant-summons": "drawmijs-instant-summons",
  "telepathic-bond": "rarys-telepathic-bond",
  "freezing-sphere": "otilukes-freezing-sphere",
  "irresistible-dance": "ottos-irresistible-dance",
  "arcane-sword": "mordenkainens-sword",
  "magnificent-mansion": "mordenkainens-magnificent-mansion",
};

const ID_CONJURO_PACK_A_SRD: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ID_CONJURO_SRD_A_PACK).map(([srdId, packId]) => [packId, srdId]),
);

/** Id del pack PHB equivalente, si el id es el slug SRD. */
export function idPackConjuro(spellId: string): string | undefined {
  return ID_CONJURO_SRD_A_PACK[spellId];
}

/** Id SRD equivalente, si el id es el slug del pack. */
export function idSrdConjuro(spellId: string): string | undefined {
  return ID_CONJURO_PACK_A_SRD[spellId];
}

/** Id actual y su gemelo SRD/PHB (sin duplicar). */
export function idsEquivalentesConjuro(spellId: string): string[] {
  const packId = idPackConjuro(spellId);
  if (packId) return [spellId, packId];
  const srdId = idSrdConjuro(spellId);
  if (srdId) return [spellId, srdId];
  return [spellId];
}
