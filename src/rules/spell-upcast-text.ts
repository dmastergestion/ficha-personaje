import type { SpellDamage } from "@/rules/spell-cast-meta";
import { textoDadosDañoConjuro } from "@/rules/spell-cast-meta";
import {
  clasesParaConjuros,
  esSoloMagiaPacto,
  nivelEspacioPacto,
} from "@/rules/spells";
import { srdSpells } from "@/rules/srd";
import type { Character } from "@/schemas/character";

const PALABRA_NUM: Record<number, string> = {
  1: "un",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
};

const NUM_PALABRA: Record<string, number> = {
  un: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

/** Rayos de Descarga sobrenatural (y trucos equivalentes) según nivel de personaje. */
export function rayosTrucoPersonaje(nivelPersonaje: number): number {
  return (
    1 +
    (nivelPersonaje >= 5 ? 1 : 0) +
    (nivelPersonaje >= 11 ? 1 : 0) +
    (nivelPersonaje >= 17 ? 1 : 0)
  );
}

/** Nivel de espacio con el que se muestra el conjuro (pacto al máximo si solo brujo). */
export function nivelRanuraMostrada(character: Character, nivelBaseConjuro: number): number {
  if (nivelBaseConjuro <= 0) return 0;
  if (esSoloMagiaPacto(character)) {
    return nivelEspacioPacto(clasesParaConjuros(character));
  }
  return nivelBaseConjuro;
}

function pluralizar(unidad: string, n: number): string {
  const singular = unidad.replace(/s$/i, "");
  if (n === 1) return singular;
  if (singular.endsWith("z")) return `${singular.slice(0, -1)}ces`;
  if (singular.endsWith("a") || singular.endsWith("e") || singular.endsWith("o")) {
    return `${singular}s`;
  }
  return `${singular}s`;
}

function etiquetaCantidad(n: number, unidad: string): string {
  const noun = pluralizar(unidad, n);
  if (n === 1) return `${noun.endsWith("a") ? "una" : "un"} ${noun}`;
  return `${PALABRA_NUM[n] ?? String(n)} ${noun}`;
}

function extraPorUpcast(parrafo: string): { unidad: string; porEncimaDe: number } | null {
  const m = parrafo.match(
    /(?:un|una)\s+(\w+)\s+(?:más|adicional)(?:es)?\s+por cada nivel(?: del| de)?(?: el)? espacio de conjuro por encima de (\d+)/i,
  );
  if (!m) return null;
  return { unidad: m[1]!.replace(/s$/i, ""), porEncimaDe: Number(m[2]) };
}

const PARRAFO_UPCAST =
  /\n*Usar un espacio de conjuro de nivel superior[.\s:][\s\S]*$/i;
const PARRAFO_TRUCO = /\n*Mejora de truco[.\s:][\s\S]*$/i;

/**
 * Cuántos proyectiles/objetivos discretos genera el conjuro a esa ranura.
 * 1 = un solo haz o no aplica (cono, esfera…).
 */
export function proyectilesConjuro(
  spellId: string,
  nivelBase: number,
  nivelRanura: number,
  nivelPersonaje: number,
  descripcion?: string,
): number {
  if (spellId === "eldritch-blast") return rayosTrucoPersonaje(nivelPersonaje);

  const extraRanura = Math.max(0, nivelRanura - Math.max(nivelBase, 1));
  if (spellId === "magic-missile") return 3 + extraRanura;
  if (spellId === "scorching-ray") return 3 + Math.max(0, nivelRanura - 2);

  if (!descripcion || nivelBase <= 0) return 1;
  const upcast = descripcion.match(PARRAFO_UPCAST)?.[0] ?? "";
  const extra = extraPorUpcast(upcast);
  if (!extra) return 1;
  const cuerpo = descripcion.replace(PARRAFO_UPCAST, "");
  const re = new RegExp(
    `\\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\\d+)\\s+${extra.unidad}s?\\b`,
    "i",
  );
  const hallado = cuerpo.match(re);
  let base = 1;
  if (hallado) {
    const raw = hallado[1]!.toLowerCase();
    base = NUM_PALABRA[raw] ?? Number(raw) ?? 1;
  }
  return base + Math.max(0, nivelRanura - extra.porEncimaDe);
}

/** Reescribe la descripción como si el conjuro se lanzara ya a esa ranura. */
export function aplicarUpcastEnDescripcion(
  texto: string,
  opts: {
    spellId: string;
    nivelBase: number;
    nivelRanura: number;
    nivelPersonaje: number;
    damage?: SpellDamage;
  },
): string {
  let out = texto;
  const { nivelBase, nivelRanura, nivelPersonaje, damage, spellId } = opts;
  const aplicarRanura = nivelBase > 0 && nivelRanura >= nivelBase;
  const proyectiles = proyectilesConjuro(
    spellId,
    nivelBase,
    nivelRanura,
    nivelPersonaje,
    texto,
  );

  if (damage?.dice && damage.scalePerSlot && aplicarRanura) {
    const escalado = textoDadosDañoConjuro(
      damage,
      nivelBase,
      nivelRanura,
      nivelPersonaje,
    );
    if (escalado && damage.dice !== escalado) {
      out = out.replaceAll(damage.dice, escalado);
    }
  }

  const upcast = out.match(PARRAFO_UPCAST)?.[0] ?? "";
  const extra = extraPorUpcast(upcast);
  const unidad =
    extra?.unidad ??
    (spellId === "magic-missile"
      ? "dardo"
      : spellId === "scorching-ray" || spellId === "eldritch-blast"
        ? "rayo"
        : null);

  if (unidad && proyectiles >= 1) {
    const re = new RegExp(
      `\\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\\d+)\\s+${unidad}s?\\b`,
      "i",
    );
    const etiqueta = etiquetaCantidad(proyectiles, unidad);
    if (re.test(out)) {
      out = out.replace(re, etiqueta);
    }
  }

  if (aplicarRanura) {
    out = out.replace(PARRAFO_UPCAST, "");
  }
  if (spellId === "eldritch-blast" && proyectiles > 1) {
    out = out.replace(PARRAFO_TRUCO, "");
  }

  out = out
    .replace(/\s*\{Level[^}]*\}/g, "")
    .replace(/\s*\{Rayos totales\}/g, "")
    .replace(
      /\s*\{Número de saltos\}/g,
      aplicarRanura && nivelRanura > 0
        ? `\nPuede saltar hasta ${PALABRA_NUM[nivelRanura] ?? nivelRanura} ${nivelRanura === 1 ? "vez" : "veces"}.`
        : "",
    );

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function descripcionConjuroMostrada(
  character: Character,
  spellId: string,
  texto: string | undefined,
  damage?: SpellDamage,
): string | undefined {
  if (!texto) return texto;
  const nivelBase = srdSpells.find((s) => s.id === spellId)?.level ?? 0;
  const nivelRanura = nivelRanuraMostrada(character, nivelBase);
  const aplica =
    (nivelBase > 0 && esSoloMagiaPacto(character)) ||
    spellId === "eldritch-blast" ||
    (nivelBase === 0 && /Mejora de truco/i.test(texto));
  if (!aplica) return texto;
  return aplicarUpcastEnDescripcion(texto, {
    spellId,
    nivelBase,
    nivelRanura,
    nivelPersonaje: character.identity.level,
    damage,
  });
}
