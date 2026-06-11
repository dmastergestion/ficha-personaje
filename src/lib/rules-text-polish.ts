import { limpiarTextoFoundry } from "./foundry-text-clean";

/** Convierte pies D&D (5 ft = 1,5 m) a metros con coma decimal española. */
export function piesAMetrosTexto(pies: number): string {
  const metros = pies * 0.3;
  if (Number.isInteger(metros)) return String(metros);
  return metros.toFixed(1).replace(".", ",");
}

function convertirPiesAMetros(text: string): string {
  return text.replace(/\b(\d+(?:[.,]\d+)?)\s*(?:pies|feet)\b/gi, (_, raw: string) => {
    const pies = parseFloat(raw.replace(",", "."));
    return `${piesAMetrosTexto(pies)} metros`;
  });
}

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
];

/** Pulido editorial PHB 2024 ES: términos de juego en minúsculas y distancias en metros. */
export function pulirTextoReglasEs(text: string): string {
  let out = limpiarTextoFoundry(text);

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

  out = convertirPiesAMetros(out);

  return out.trim();
}
