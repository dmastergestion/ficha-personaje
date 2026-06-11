import { limpiarTextoFoundry } from "./foundry-text-clean";

/** Convierte pies D&D (5 ft = 1,5 m) a metros con coma decimal española. */
export function piesAMetrosTexto(pies: number): string {
  const metros = pies * 0.3;
  if (Number.isInteger(metros)) return String(metros);
  return metros.toFixed(1).replace(".", ",");
}

function parseNumeroEs(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

function formatearPies(pies: number): string {
  return Number.isInteger(pies) ? String(pies) : pies.toFixed(1).replace(".", ",");
}

/** Distancia en pies y metros: «30 pies (9 m)». */
export function formatoDistanciaDual(pies: number): string {
  return `${formatearPies(pies)} pies (${piesAMetrosTexto(pies)} m)`;
}

/** Unifica distancias sueltas en texto a formato dual pies (m). Idempotente. */
export function unificarDistanciasEnTexto(text: string): string {
  let out = text.replace(
    /\b(\d+(?:[.,]\d+)?)\s*pies\s*\(\s*(\d+(?:[.,]\d+)?)\s*m\s*\)/gi,
    (_, piesRaw: string) => formatoDistanciaDual(parseNumeroEs(piesRaw)),
  );

  out = out.replace(/\b(\d+(?:[.,]\d+)?)\s*metros\b/gi, (_, raw: string) => {
    const metros = parseNumeroEs(raw);
    return formatoDistanciaDual(metros / 0.3);
  });

  out = out.replace(
    /\b(\d+(?:[.,]\d+)?)\s*(?:pies|feet)\b(?!\s*\()/gi,
    (_, raw: string) => formatoDistanciaDual(parseNumeroEs(raw)),
  );

  return out;
}

const ALCANCE_ES: Record<string, string> = {
  touch: "Toque",
  self: "Personal",
  sight: "Vista",
  special: "Especial",
  unlimited: "Ilimitado",
};

/** Normaliza alcance de conjuro o arma para la UI (pies + metros, etiquetas ES). */
export function traducirAlcanceConjuro(range?: string): string | undefined {
  if (!range?.trim()) return undefined;
  const raw = range.trim();
  if (raw === "point" || raw === "feet") return undefined;
  const lower = raw.toLowerCase();
  if (ALCANCE_ES[lower]) return ALCANCE_ES[lower];

  const slash = /^(\d+)\/(\d+)$/.exec(raw);
  if (slash) {
    const corto = parseInt(slash[1]!, 10);
    const largo = parseInt(slash[2]!, 10);
    return `${corto}/${largo} pies (${piesAMetrosTexto(corto)}/${piesAMetrosTexto(largo)} m)`;
  }

  if (/^\d+(?:[.,]\d+)?\s*metros$/i.test(raw)) {
    return formatoDistanciaDual(parseNumeroEs(raw) / 0.3);
  }

  if (/^\d+(?:[.,]\d+)?\s*(?:pies|feet)$/i.test(raw)) {
    return formatoDistanciaDual(parseNumeroEs(raw));
  }

  if (/^\d+(?:[.,]\d+)?\s*pies\s*\(/i.test(raw)) {
    return unificarDistanciasEnTexto(raw);
  }

  return unificarDistanciasEnTexto(raw);
}

const CONDITION_APPLY_FALSE: Record<string, string> = {
  blinded: "cegado",
  charmed: "hechizado",
  frightened: "asustado",
  grappled: "agarrado",
  incapacitated: "incapacitado",
  invisible: "invisible",
  paralyzed: "paralizado",
  poisoned: "envenenado",
  prone: "derribado",
  restrained: "apresado",
  stunned: "aturdido",
};

const AREA_TERMS = ["Emanación", "Cubo", "Cono", "Cilindro", "Esfera", "Línea", "Cuadrado"];

const DAMAGE_LOWER: [RegExp, string][] = [
  [/daño de Frío/gi, "daño de frío"],
  [/daño de Fuerza/gi, "daño de fuerza"],
  [/daño de Trueno/gi, "daño de trueno"],
  [/daño Necrótico/gi, "daño necrótico"],
  [/daño Radiante/gi, "daño radiante"],
  [/daño Cortante/gi, "daño cortante"],
  [/daño Perforante/gi, "daño perforante"],
  [/daño Contundente/gi, "daño contundente"],
  [/daño de Veneno/gi, "daño de veneno"],
  [/daño de Ácido/gi, "daño de ácido"],
  [/daño de Fuego/gi, "daño de fuego"],
  [/daño de Relámpago/gi, "daño de relámpago"],
  [/daño de Psíquico/gi, "daño de psíquico"],
  [/daño de Necrótico/gi, "daño de necrótico"],
  [/daño de Radiante/gi, "daño de radiante"],
  [/infligís 1d4 de daño Radiante/gi, "infligís 1d4 de daño radiante"],
  [/infligís 2d6 de daño Radiante/gi, "infligís 2d6 de daño radiante"],
  [/Resistencia al daño Radiante/gi, "resistencia al daño radiante"],
  [/daño adicional\s+al objetivo/gi, "daño adicional de 1d6 al objetivo"],
];

function reemplazarCondicionApplyFalse(text: string): string {
  return text.replace(/\b(\w+)\s+apply=false\b/gi, (_, cond: string) => {
    const key = cond.toLowerCase();
    return CONDITION_APPLY_FALSE[key] ?? key;
  });
}

const TRADUCCION_ROTA: [RegExp, string][] = [
  [/\bdifficultterrain\b/gi, "terreno difícil"],
  [/\bDifficultTerrain\b/g, "terreno difícil"],
  [/\blightlyobscured\b/gi, "ligeramente oscurecido"],
  [/\bLightlyObscured\b/g, "ligeramente oscurecido"],
  [/\bheavilyobscured\b/gi, "gravemente oscurecido"],
  [/\bHeavilyObscured\b/g, "gravemente oscurecido"],
  [/Study\{Estudiar\}/g, "Estudiar"],
  [/pruebas de\s+y no dejáis huellas/g, "pruebas de Destreza (Sigilo) y no dejáis huellas"],
  [
    /prueba\s+o\s+que hagas para encontrarlo/g,
    "prueba de Sabiduría (Perspicacia o Percepción) que hagas para encontrarlo",
  ],
  [
    /hacer una prueba\s+contra tu CD de salvación de conjuros para no creerla/g,
    "hacer una prueba de Inteligencia (Investigación) contra tu CD de salvación de conjuros para no creerla",
  ],
  [
    /con una prueba\s+contra la CD de salvación de tu conjuro/g,
    "con una prueba de Inteligencia (Investigación) contra la CD de salvación de tu conjuro",
  ],
  [
    /hacer una prueba\s+contra tu CD de salvación de conjuros/g,
    "hacer una prueba de Fuerza (Atletismo) contra tu CD de salvación de conjuros",
  ],
  [
    /prueba\s+como acción para escapar/g,
    "prueba de Fuerza (Atletismo) como acción para escapar",
  ],
  [/salvación de \./g, "salvación de Carisma"],
  [/\bTerreno difícil\b/g, "terreno difícil"],
  [/\bRestringid([oa])\b/gi, "apresad$1"],
  [/\bAmistosa\b/g, "amistosa"],
  [/\bHechizad([oa])\b/gi, "hechizad$1"],
  [/\bAsustad([oa])\b/gi, "asustad$1"],
  [/\bDerribad([oa])\b/gi, "derribad$1"],
  [/\bCegad([oa])\b/gi, "cegad$1"],
  [/\bInmune\b/g, "inmune"],
  [/\bVelocidad de\b/g, "velocidad de"],
  [/\bAcción adicional\b/g, "acción adicional"],
  [/\bacción Mágica\b/g, "acción mágica"],
  [/\bacción Atacar\b/g, "acción Atacar"],
  [/\bacción dash\b/gi, "acción Correr"],
  [/\bacción Study\b/gi, "acción Estudiar"],
  [
    /cada metro de movimiento cuesta un metro adicional/gi,
    "cada pie de movimiento cuesta un pie adicional (0,3 m)",
  ],
  [/número de metros que te han movido/g, "número de pies que te han movido"],
  [
    /número de metros igual a 3 veces el número obtenido/g,
    "número de pies igual a 10 veces el número obtenido (3 m por punto)",
  ],
];

function pulirAreasEfecto(text: string): string {
  let out = text;
  for (const term of AREA_TERMS) {
    out = out.replace(new RegExp(`\\b${term}\\b`, "g"), term.toLowerCase());
  }
  return out;
}

/** Pulido editorial PHB 2024 ES: términos de juego en minúsculas y distancias pies (m). */
export function pulirTextoReglasEs(text: string): string {
  let out = limpiarTextoFoundry(text);

  out = reemplazarCondicionApplyFalse(out);

  for (const [pattern, replacement] of TRADUCCION_ROTA) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/\bDescanso Largo\b/g, "descanso largo")
    .replace(/\bDescanso Corto\b/g, "descanso corto")
    .replace(/\bDesventaja\b/g, "desventaja")
    .replace(/\bReacciones\b/g, "reacciones")
    .replace(/\bReacción\b/g, "reacción")
    .replace(/\bInmunidad\b/g, "inmunidad")
    .replace(/\bVulnerabilidad\b/g, "vulnerabilidad")
    .replace(/\bBonificador de Competencia\b/gi, "bonificador de competencia")
    .replace(/\bPuntos de Golpe\b/g, "puntos de golpe")
    .replace(/\bPV\b/g, "puntos de golpe")
    .replace(/\bVisión Oscura\b/gi, "visión en la oscuridad")
    .replace(/\bLuz Brillante\b/g, "luz brillante")
    .replace(/\bLuz Tenue\b/g, "luz tenue")
    .replace(/\bLuz brillante\b/g, "luz brillante")
    .replace(/\bLuz tenue\b/g, "luz tenue")
    .replace(/\bcondición Restringida\b/gi, "condición restringida")
    .replace(/\bcriatura Restringida\b/gi, "criatura restringida")
    .replace(/prueba de habilidad/gi, "prueba de característica")
    .replace(/\bVentaja en salvaciones\b/g, "ventaja en tiradas de salvación")
    .replace(/Usando un espacio de conjuro de nivel superior/gi, "Usar un espacio de conjuro de nivel superior")
    .replace(/Si usas un espacio de conjuro de nivel/gi, "Si usas un espacio de conjuro de nivel");

  for (const [pattern, replacement] of DAMAGE_LOWER) {
    out = out.replace(pattern, replacement);
  }

  out = out
    .replace(/\bespacios Grandes\b/g, "espacios grandes")
    .replace(/\bes Grande o más pequeñ[oa]\b/gi, (m) => m.toLowerCase())
    .replace(/\bes Enorme o más pequeñ[oa]\b/gi, (m) => m.toLowerCase());

  out = pulirAreasEfecto(out);
  out = unificarDistanciasEnTexto(out);

  return out.trim();
}
