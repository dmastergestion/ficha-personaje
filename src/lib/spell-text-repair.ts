const ABILITY_ES: Record<string, string> = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitución",
  intelligence: "Inteligencia",
  wisdom: "Sabiduría",
  charisma: "Carisma",
};

const SKILL_ES: Record<string, string> = {
  athletics: "Atletismo",
  perception: "Percepción",
  survival: "Supervivencia",
  investigation: "Investigación",
  stealth: "Sigilo",
  acrobatics: "Acrobacias",
};

function pruebaCaracteristicaDesdeEn(textEn: string): string | undefined {
  const m = textEn.match(
    /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*\(([^)]+)\)/i,
  );
  if (!m) return undefined;
  const ab = ABILITY_ES[m[1]!.toLowerCase()] ?? m[1]!;
  const skills = m[2]!
    .split(/\s+or\s+/i)
    .map((s) => SKILL_ES[s.trim().toLowerCase()] ?? s.trim())
    .join(" o ");
  return `${ab} (${skills})`;
}

function dadosDanioDesdeEn(textEn: string): string[] {
  return [...textEn.matchAll(/(\d+d\d+)\s+(?:\w+\s+)*(?:damage|Psychic)/gi)].map((m) => m[1]!);
}

/** Rellena huecos dejados por marcadores Foundry/5etools rotos usando el texto EN de referencia. */
export function repararTextoConjuroConReferencia(textEs: string, textEn?: string): string {
  let out = textEs
    .replace(/damageresistencia\{([^}]+)\}/gi, "$1")
    .replace(/damagevulnerability\{([^}]+)\}/gi, "$1")
    .replace(/Reaction\{Reactions\}/gi, "reacciones");

  out = out.replace(
    /1 nivel de (?:Exhaustion|agotamiento)La condición hechizado o PetrificadoUna maldición, incluida la Vinculación del objetivo a un objeto mágico malditoCualquier reducción a una de las puntuaciones de característica del objetivoCualquier reducción al máximo de puntos de golpe del objetivo/gi,
    "1 nivel de agotamiento; la condición hechizado o petrificado; una maldición, incluida la vinculación del objetivo a un objeto mágico maldito; cualquier reducción a una de las puntuaciones de característica del objetivo; cualquier reducción al máximo de puntos de golpe del objetivo",
  );

  out = out.replace(
    /La duración aumenta Si usas un espacio de conjuro de nivel 6 \(10 días\), 7 \(30 días\), 8 \(180 días\) o 9 \(366 días\)\./,
    "La duración aumenta con un espacio de nivel 6 (10 días), 7 (30 días), 8 (180 días) o 9 (366 días).",
  );

  out = out.replace(
    /prueba de\s+contra tu CD de salvación de conjuro para liberarse/g,
    "prueba de Fuerza (Atletismo) contra tu CD de salvación de conjuro para liberarse",
  );

  if (!textEn) return out;

  if (/tira\s+y consulta/i.test(out) && /rolls 1d100/i.test(textEn)) {
    out = out.replace(/tira\s+y consulta/i, "tira 1d100 y consulta");
  }

  const check = pruebaCaracteristicaDesdeEn(textEn);
  if (check) {
    out = out
      .replace(/prueba de\s+o\s+/g, `prueba de ${check} `)
      .replace(/prueba de\s+contra/g, `prueba de ${check} contra`)
      .replace(/una prueba de\s+para/g, `una prueba de ${check} para`)
      .replace(/prueba de\s+que hagas/g, `prueba de ${check} que hagas`);
  }

  const dice = dadosDanioDesdeEn(textEn);
  if (dice.length) {
    let i = 0;
    out = out.replace(/  de daño/g, () => {
      const d = dice[i++];
      return d ? ` ${d} de daño` : " de daño";
    });
  }

  return out;
}
