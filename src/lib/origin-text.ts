import { pulirTextoReglasEs } from "./rules-text-polish";



/** Limpia marcadores 5etools/Foundry en rasgos de especie y trasfondo. */

export function limpiarTextoOrigen(text: string): string {
  return pulirDescripcionEspecie(pulirTextoReglasEs(text));
}

const DRAGONBORN_ANCESTRO: Record<string, { nombre: string; dano: string }> = {
  black: { nombre: "negro", dano: "ácido" },
  blue: { nombre: "azul", dano: "relámpago" },
  brass: { nombre: "latón", dano: "fuego" },
  bronze: { nombre: "bronce", dano: "relámpago" },
  copper: { nombre: "cobrizo", dano: "ácido" },
  gold: { nombre: "dorado", dano: "fuego" },
  green: { nombre: "verde", dano: "veneno" },
  red: { nombre: "rojo", dano: "fuego" },
  silver: { nombre: "plateado", dano: "frío" },
  white: { nombre: "blanco", dano: "frío" },
};

/** Quita cabecera mecánica redundante del bloque de rasgos Foundry/5etools. */
function quitarCabeceraEspecieFoundry(text: string): string {
  return text
    .replace(/^Rasgos de [^\n]+\n+/i, "")
    .replace(/^Tipo de criatura:\s*Humanoide\n+/i, "")
    .replace(/^Tamaño:\s*[^\n]+\n+/i, "")
    .replace(/^Velocidad:\s*[^\n]+\n+/i, "")
    .replace(/^Como [^,\n]+, tienes los siguientes rasgos especiales\.\n+/i, "")
    .trim();
}

/** Ajusta descripción genérica de dracónido/goliat a subrazas con ancestro fijo. */
export function personalizarEspeciePorId(id: string, text: string): string {
  if (id.startsWith("dragonborn-") && id !== "dragonborn") {
    const color = id.slice("dragonborn-".length);
    const ancestro = DRAGONBORN_ANCESTRO[color];
    if (!ancestro) return text;

    const sinTabla = text.replace(
      /Ascendencia dracónica\.[^\n]*\n\nAncestros dracónicos:\n(?:[^\n]+\n){5}\n?/,
      `Ascendencia dracónica. Tu ancestro es el dragón ${ancestro.nombre}; tu arma de aliento inflige daño de ${ancestro.dano}.\n\n`,
    );

    return sinTabla.replace(
      /Tienes resistencia al tipo de daño de tu ancestro dracónico\./,
      `Tienes resistencia al daño de ${ancestro.dano}.`,
    );
  }

  if (id.startsWith("goliath-") && id !== "goliath") {
    const suffix = id.slice("goliath-".length);
    const etiquetas: Record<string, string> = {
      "cloud-giant": "gigante de las nubes",
      "fire-giant": "gigante de fuego",
      "frost-giant": "gigante de escarcha",
      "hill-giant": "gigante de las colinas",
      "stone-giant": "gigante de piedra",
      "storm-giant": "gigante de tormenta",
    };
    const etiqueta = etiquetas[suffix];
    if (!etiqueta) return text;
    return `Ancestro gigante: ${etiqueta}.\n\n${text}`;
  }

  return text;
}

/** Corrige tablas y formato roto al importar descripciones de especies desde Foundry. */
export function pulirDescripcionEspecie(text: string): string {
  return quitarCabeceraEspecieFoundry(text)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\. inteligencia, sabiduría o carisma/gi, ". Inteligencia, Sabiduría o Carisma")
    .replace(/\nresistencia al daño\./gi, "\nResistencia al daño.")
    .replace(/\nconstitución poderosa\./gi, "\nConstitución poderosa.")
    .replace(/\bcompetencia en una habilidad\b/gi, "competencia en una pericia")
    .replace(/\bhabilidades sobrenaturales\b/gi, "dones sobrenaturales")
    .replace(/\bdaño por Veneno\b/gi, "daño de veneno")
    .replace(/\bTienes Resistencia al tipo de daño\b/g, "Tienes resistencia al tipo de daño")
    .replace(/\bacción de Ataque\b/gi, "acción Atacar")
    .replace(/\bSentido sísmico\b/g, "sentido sísmico")
    .replace(/\bInspiración heroica\b/g, "inspiración heroica")
    .replace(/\bPunto de golpe\b/gi, "punto de golpe")
    .replace(/\(CA 5, 1 PG\)/g, "(clase de armadura 5, 1 punto de golpe)")
    .replace(/\bacción Utilizar\b/gi, "acción Usar")
    .replace(/\bventaja en salvaciones\b/gi, "ventaja en las tiradas de salvación")
    .replace(
      /Ancestros dracónicosDragónTipo de dañoDragónTipo de daño\nNegroÁcidoDoradoFuego\nAzulRelámpagoVerdeVeneno\nLatónFuegoRojoFuego\nBronceRelámpagoPlateadoFrío\nCobrizoÁcidoBlancoFrío/g,
      "Ancestros dracónicos (elige un dragón progenitor):\nNegro — ácido | Dorado — fuego\nAzul — relámpago | Verde — veneno\nLatón — fuego | Rojo — fuego\nBronce — relámpago | Plateado — frío\nCobrizo — ácido | Blanco — frío",
    )
    .replace(/(Rasgos del [^\n]+)Nivel 1Nivel 3Nivel 5/g, "$1\nNivel 1 · Nivel 3 · Nivel 5")
    .replace(/(Legados? infernales?)Nivel 1Nivel 3Nivel 5/gi, "$1\nNivel 1 · Nivel 3 · Nivel 5")
    .replace(/(Rasgos del linaje [^\n]+)Nivel 1Nivel 3Nivel 5/gi, "$1\nNivel 1 · Nivel 3 · Nivel 5");
}



/** Quita bloques mecánicos del trasfondo 2024 (ya mostrados en «Obtienes»). */

export function limpiarTraitsTrasfondo(traits: string): string {

  const sinMecanica = traits

    .replace(/Ability Scores::[^]*?(?=Feat::|Skill Proficiencies::|Tool Proficiency::|Equipment::|$)/gi, "")

    .replace(/Feat::[^]*?(?=Skill Proficiencies::|Tool Proficiency::|Equipment::|$)/gi, "")

    .replace(/Skill Proficiencies::[^]*?(?=Tool Proficiency::|Equipment::|$)/gi, "")

    .replace(/Tool Proficiency::[^]*?(?=Equipment::|$)/gi, "")

    .trim();



  const equipo = traits.match(/Equipment::\s*(.+)$/i)?.[1]?.trim();

  const partes = [sinMecanica, equipo ? `Equipo: ${equipo}` : ""].filter(Boolean);

  if (!partes.length) return "";

  return limpiarTextoOrigen(partes.join("\n\n"));

}



const TOOL_LABELS_ES: Record<string, string> = {

  "calligrapher's supplies": "Suministros de calígrafo",

  "thieves' tools": "Herramientas de ladrón",

  "gaming set": "Juego de mesa",

  "herbalism kit": "Kit de herbolaria",

  "navigator's tools": "Herramientas de navegante",

  "carpenter's tools": "Herramientas de carpintero",

  "cook's utensils": "Utensilios de cocinero",

  "mason's tools": "Herramientas de albañil",

  "painter's supplies": "Suministros de pintor",

  "potter's tools": "Herramientas de alfarero",

  "smith's tools": "Herramientas de herrero",

  "tinker's tools": "Herramientas de cacharrero",

  "weaver's tools": "Herramientas de tejedor",

  "woodcarver's tools": "Herramientas de tallador",

};



/** Etiqueta legible para competencia en herramienta. */

export function etiquetaHerramienta(raw: string): string {

  const trimmed = raw.trim();

  if (!trimmed) return raw;



  const choose = trimmed.match(/^choose one kind of (.+)$/i);

  if (choose) {

    const kind = choose[1]!.toLowerCase();

    const base = TOOL_LABELS_ES[kind] ?? kind;

    return `A elegir: ${base}`;

  }



  const lower = trimmed.toLowerCase();

  return TOOL_LABELS_ES[lower] ?? trimmed;

}


