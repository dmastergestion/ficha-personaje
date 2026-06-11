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

/** Limpia marcadores 5etools/Foundry para lectura en ficha. */
export function limpiarTextoConjuro(text: string): string {
  return text
    .replace(/\{@(?:damage|dice|scaledamage|scaledice|hit)\s+[^}]+\}/gi, "")
    .replace(/\{@(?:spell|item|action|filter|condition|chance)[^}]+\}/gi, "")
    .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/gi, "$1")
    .replace(/\[\[\/r[^\]]*\]\]\{([^}]*)\}/gi, "$1")
    .replace(/\[\[[^\]]+\]\]/g, "")
    .replace(/&amp;Reference\[([^\]|]+)(?:\s+apply=false)?\]/gi, (_, ref) => {
      const key = ref.trim().split(/\s+/)[0]?.toLowerCase() ?? ref;
      return CONDITION_ES[key] ?? ref.trim();
    })
    .replace(/&amp;Reference\[([^\]]+)\]/gi, "$1")
    .replace(/\|XPHB/gi, "")
    .replace(/XPHB\|/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/Using a Higher-Level Spell Slot\./gi, "Usar un espacio de conjuro de nivel superior.")
    .replace(/At Higher Levels\./gi, "A niveles superiores.")
    .replace(/\nNota de Foundry\n[\s\S]*$/i, "")
    .replace(/MaterialDuración/g, "Material\nDuración")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
