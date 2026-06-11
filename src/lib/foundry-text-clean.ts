const CONDITION_ES: Record<string, string> = {
  blinded: "Cegado",
  charmed: "Hechizado",
  deafened: "Ensordecido",
  frightened: "Asustado",
  grappled: "Agarrado",
  incapacitated: "Incapacitado",
  invisible: "Invisible",
  paralyzed: "Paralizado",
  petrified: "Petrificado",
  poisoned: "Envenenado",
  prone: "Derribado",
  restrained: "Apresado",
  stunned: "Aturdido",
  unconscious: "Inconsciente",
};

/** @UUID[...]{etiqueta} o @UUID[...]{etiqueta sin cierre */
export function reemplazarUuidFoundry(text: string): string {
  return text
    .replace(/@UUID\[[^\]]+\]\{([^}]*)\}/gi, "$1")
    .replace(/@UUID\[[^\]]+\]\{([^},\n]+)/gi, "$1")
    .replace(/@UUID\[[^\]]+\]/gi, "");
}

export function reemplazarEmbedFoundry(text: string): string {
  return text.replace(/@Embed\[[^\]]+\]/gi, "");
}

export function reemplazarReferenciasFoundry(text: string): string {
  return text.replace(/&amp;Reference\[([^\]]+)\]/gi, (_, ref: string) => {
    const key = ref.trim().split(/\s+/)[0]?.toLowerCase() ?? ref;
    return CONDITION_ES[key] ?? ref.trim();
  });
}

/** Convierte HTML de compendio Foundry a texto plano legible. */
export function htmlFoundryAPlano(html: string): string {
  const sinSecretos = html.replace(
    /<section[^>]*class="secret"[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  return limpiarTextoFoundry(
    sinSecretos
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}

/** Limpia marcadores 5etools/Foundry para lectura en ficha. */
export function limpiarTextoFoundry(text: string): string {
  return reemplazarEmbedFoundry(
    reemplazarUuidFoundry(
      reemplazarReferenciasFoundry(text)
        .replace(/\{@(?:damage|dice|scaledamage|scaledice|hit|dc)\s+[^}]+\}/gi, "")
        .replace(/\{@(?:spell|item|action|filter|condition|chance|feat|skill|sense|hazard|table|itemProperty|variantrule)[^}]+\}/gi, "")
        .replace(/\[\[\/r[^\]]*\]\]\{([^}]*)\}/gi, "$1")
        .replace(/\[\[[^\]]+\]\]/g, "")
        .replace(/\|XPHB/gi, "")
        .replace(/XPHB\|/gi, "")
        .replace(/\bXPHB\b/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/Proficiency Bonus/gi, "bonificador de competencia")
        .replace(/Bonificador por competencia/gi, "bonificador de competencia")
        .replace(/Hit Points?/gi, "puntos de golpe")
        .replace(/Puntos de Golpe/gi, "puntos de golpe")
        .replace(/Long Rest/gi, "descanso largo")
        .replace(/Descanso largo/gi, "descanso largo")
        .replace(/Short Rest/gi, "descanso corto")
        .replace(/Bonus Action/gi, "acción adicional")
        .replace(/Acción adicional/gi, "acción adicional")
        .replace(/Magic action/gi, "acción mágica")
        .replace(/Acción Mágica/gi, "acción mágica")
        .replace(/Advantage/gi, "ventaja")
        .replace(/Ventaja/gi, "ventaja")
        .replace(/Disadvantage/gi, "desventaja")
        .replace(/Darkvision/gi, "visión en la oscuridad")
        .replace(/Resistance/gi, "resistencia")
        .replace(/Resistencia al daño/gi, "resistencia al daño")
        .replace(/controllingamount\{([^}]+)\}/gi, "$1")
        .replace(/\nNota de Foundry[\s\S]*$/i, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n"),
    ),
  ).trim();
}
