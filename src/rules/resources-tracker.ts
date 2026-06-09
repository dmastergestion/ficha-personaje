import classResourceMeta from "@/data/srd/class-resource-meta.json";
import type { ResourceRecharge } from "@/lib/constants";
import type { ClassLevel, Character, CharacterResource } from "@/schemas/character";

type ResourceMetaEntry = {
  id: string;
  name: string;
  recharge: ResourceRecharge;
  perLevel: Record<string, number>;
};

type ClassResourceMetaFile = Record<string, ResourceMetaEntry[]>;

const meta = classResourceMeta as unknown as ClassResourceMetaFile;

export function maxRecursoClase(classId: string, resourceId: string, level: number): number {
  const entry = meta[classId]?.find((r) => r.id === resourceId);
  if (!entry) return 0;

  let max = 0;
  for (const [lvl, value] of Object.entries(entry.perLevel)) {
    if (level >= Number(lvl)) max = value;
  }
  return max;
}

export function recursosSugeridos(classes: ClassLevel[]): CharacterResource[] {
  const byId = new Map<string, CharacterResource>();

  for (const { classId, level } of classes) {
    for (const entry of meta[classId] ?? []) {
      const max = maxRecursoClase(classId, entry.id, level);
      if (max <= 0) continue;
      const key = `${classId}:${entry.id}`;
      const existing = byId.get(key);
      if (existing) {
        existing.max = Math.max(existing.max, max);
      } else {
        byId.set(key, {
          id: key,
          name: entry.name,
          max,
          used: 0,
          recharge: entry.recharge,
        });
      }
    }
  }

  return [...byId.values()];
}

export function ajustarRecurso(
  character: Character,
  resourceId: string,
  deltaUsed: number,
): Character {
  return {
    ...character,
    resources: character.resources.map((r) => {
      if (r.id !== resourceId) return r;
      const used = Math.min(r.max, Math.max(0, r.used + deltaUsed));
      return { ...r, used };
    }),
  };
}

export function aplicarRecargaRecursos(
  character: Character,
  tipo: "short" | "long",
): Character {
  return {
    ...character,
    resources: character.resources.map((r) => {
      if (r.recharge === "none") return r;
      if (tipo === "short" && r.recharge !== "short") return r;
      return { ...r, used: 0 };
    }),
  };
}

export function poblarRecursosSugeridos(character: Character): Character {
  const sugeridos = recursosSugeridos(character.identity.classes);
  const existentes = new Map(character.resources.map((r) => [r.id, r]));

  const merged = sugeridos.map((s) => {
    const prev = existentes.get(s.id);
    if (!prev) return { ...s, used: 0 };
    return {
      ...s,
      used: Math.min(s.max, prev.used),
    };
  });

  for (const r of character.resources) {
    if (!merged.some((m) => m.id === r.id)) merged.push(r);
  }

  return { ...character, resources: merged };
}
