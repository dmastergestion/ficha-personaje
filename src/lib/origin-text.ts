import { limpiarTextoFoundry } from "./foundry-text-clean";



/** Limpia marcadores 5etools/Foundry en rasgos de especie y trasfondo. */

export function limpiarTextoOrigen(text: string): string {
  return pulirDescripcionEspecie(limpiarTextoFoundry(text));
}

/** Corrige tablas y formato roto al importar descripciones de especies desde Foundry. */
export function pulirDescripcionEspecie(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\. inteligencia, sabiduría o carisma/gi, ". Inteligencia, Sabiduría o Carisma")
    .replace(/\nresistencia al daño\./gi, "\nResistencia al daño.")
    .replace(/\nconstitución poderosa\./gi, "\nConstitución poderosa.")
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


