import classResourceMeta from "@/data/srd/class-resource-meta.json";
import { rasgosDeClase, rasgosDeSubclase } from "@/rules/class-features";
import { descripcionDote } from "@/rules/feat-text";
import { descripcionOrigenEs } from "@/rules/origin-description";
import { inferSpeciesGroupId } from "@/rules/species-catalog";
import { otorgamientoPorRecursoLibre } from "@/rules/spell-grants";
import { descripcionConjuro } from "@/rules/spell-text";
import { resumenFormasSalvaje } from "@/rules/wild-shape";
import type { Character, CharacterResource } from "@/schemas/character";

/** Palabras clave del párrafo en origin-descriptions-es (especie). */
const TRAIT_ID_TITULO_ES: Record<string, string[]> = {
  stonecunning: ["conocimiento pétreo"],
  "breath-weapon": ["aliento dracónico", "arma de aliento"],
  "draconic-flight": ["vuelo dracónico"],
  "healing-hands": ["manos sanadoras"],
  "celestial-revelation": ["revelación celestial"],
  "prestidigitation-device": ["dispositivo de prestidigitación"],
  "giant-ancestry": ["ascendencia gigante"],
  "large-form": ["forma grande"],
  "relentless-endurance": ["aguante implacable", "perseverancia implacable"],
  "adrenaline-rush": ["arrebato de adrenalina", "subidón de adrenalina"],
  "otherworldly-presence": ["presencia de otro mundo"],
};

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function coincideNombre(a: string, b: string): boolean {
  const na = normalizar(a);
  const nb = normalizar(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function parrafoRasgoEspecie(groupId: string, traitId: string): string | null {
  const desc = descripcionOrigenEs("species", groupId);
  if (!desc) return null;

  const claves = TRAIT_ID_TITULO_ES[traitId];
  if (!claves?.length) return null;

  for (const parrafo of desc.split(/\n\n+/)) {
    const inicio = normalizar(parrafo.split(/[.!?\n]/)[0] ?? "");
    if (claves.some((clave) => inicio.startsWith(clave) || inicio.includes(clave))) {
      return parrafo.trim();
    }
  }
  return null;
}

function buscarRasgoClase(classId: string, metaName: string, nombre: string) {
  const rasgos = rasgosDeClase(classId);
  const exacto = rasgos.find(
    (f) => normalizar(f.name) === normalizar(metaName) || normalizar(f.name) === normalizar(nombre),
  );
  if (exacto) return exacto;
  return rasgos.find(
    (f) => coincideNombre(f.name, metaName) || coincideNombre(f.name, nombre),
  );
}

function descripcionRecursoClase(classId: string, traitId: string, nombre: string): string | null {
  const metaName =
    (classResourceMeta as Record<string, { id: string; name: string }[]>)[classId]?.find(
      (e) => e.id === traitId,
    )?.name ?? nombre;

  const rasgo = buscarRasgoClase(classId, metaName, nombre);
  return typeof rasgo?.description === "string" ? rasgo.description : null;
}

function descripcionRecursoEspecie(r: CharacterResource): string | null {
  const parts = r.id.split(":");
  const traitId = parts[parts.length - 1];
  if (!traitId) return null;

  const groupId = r.sourceLabel ?? parts[1] ?? inferSpeciesGroupId(r.sourceLabel ?? "");
  return parrafoRasgoEspecie(groupId, traitId);
}

function descripcionRecursoDote(character: Character, r: CharacterResource): string | null {
  const match = /^feat:([^:]+):/.exec(r.id);
  if (!match) return null;
  const instanceId = match[1]!;
  const feat = character.feats.find(
    (f) => (f.instanceId ?? f.id) === instanceId || f.instanceId === instanceId,
  );
  if (!feat) return null;
  return descripcionDote(feat.id, feat.notes) ?? null;
}

function descripcionRecursoConjuro(character: Character, r: CharacterResource): string | null {
  const grant = otorgamientoPorRecursoLibre(character, r.id);
  if (!grant?.spellId) return null;

  const conjuro = descripcionConjuro(grant.spellId);
  const prefijo = conjuro
    ? `${conjuro}\n\n`
    : "";
  return `${prefijo}Puedes lanzarlo sin gastar un espacio de conjuro. Los usos se recuperan según la recarga indicada en la ficha.`.trim();
}

function descripcionFormaSalvaje(character: Character): string | null {
  const druid = character.identity.classes.find((c) => c.classId === "druid");
  if (!druid) return null;

  const formas = resumenFormasSalvaje(
    druid.level,
    character.originChoices?.class?.["wild-shape-forms"],
  );
  const base =
    "Acción adicional o acción (según nivel) para adoptar una forma bestial. Usos limitados; se recuperan en descanso largo.";
  if (formas.length === 0) return base;
  return `${base}\n\nFormas disponibles: ${formas.join(", ")}.`;
}

/** Texto de reglas para un recurso rastreado en la ficha. */
export function descripcionRecurso(
  character: Character,
  r: CharacterResource,
): string | null {
  if (r.id.endsWith(":wild-shape") || r.id === "druid:wild-shape") {
    return descripcionFormaSalvaje(character);
  }

  const conjuro = descripcionRecursoConjuro(character, r);
  if (conjuro) return conjuro;

  if (r.source === "class") {
    const [classId, traitId] = r.id.split(":");
    if (classId && traitId) {
      return descripcionRecursoClase(classId, traitId, r.name);
    }
  }

  if (r.source === "subclass" && r.sourceLabel) {
    const rasgo = rasgosDeSubclase(r.sourceLabel).find(
      (f) => coincideNombre(f.name, r.name),
    );
    return typeof rasgo?.description === "string" ? rasgo.description : null;
  }

  if (r.source === "species") {
    return descripcionRecursoEspecie(r);
  }

  if (r.source === "feat") {
    return descripcionRecursoDote(character, r);
  }

  return null;
}

/** Primera frase o recorte para tooltip del botón ℹ. */
export function resumenRecurso(texto: string, maxLen = 120): string {
  const primera = texto.split(/\n+/)[0]?.trim() ?? texto;
  if (primera.length <= maxLen) return primera;
  return `${primera.slice(0, maxLen - 1)}…`;
}
