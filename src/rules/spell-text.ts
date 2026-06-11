import spellComponentsEs from "@/data/i18n/spell-components-es.json";
import spellDescriptionsEs from "@/data/i18n/spell-descriptions-es.json";
import { limpiarTextoConjuro } from "@/lib/spell-text-clean";
import type { SpellCastMeta } from "@/rules/spell-cast-meta";

export { limpiarTextoConjuro } from "@/lib/spell-text-clean";

const descriptionsEs = spellDescriptionsEs as Record<string, string>;
const componentsEs = spellComponentsEs as Record<string, string>;

/** Traduce la línea V/S/M de componentes al español cuando hay entrada en el glosario. */
export function traducirComponentesConjuro(components?: string): string | undefined {
  if (!components) return undefined;

  const paren = components.indexOf(" (");
  if (paren === -1) return components;

  const prefix = components.slice(0, paren);
  const material = components.slice(paren + 2, -1);
  const translated = componentsEs[material] ?? material;
  return `${prefix} (${translated})`;
}

export function descripcionConjuro(spellId: string, fallback?: string): string | undefined {
  const fromEs = descriptionsEs[spellId];
  if (fromEs) return limpiarTextoConjuro(fromEs);
  if (fallback) return limpiarTextoConjuro(fallback);
  return undefined;
}

/** Metadatos de conjuro listos para mostrar en UI (español). */
export function metaConjuroParaMostrar(
  spellId: string | null | undefined,
  meta: SpellCastMeta,
): SpellCastMeta {
  if (!spellId) return meta;

  const description = descripcionConjuro(spellId, meta.description);
  const components = traducirComponentesConjuro(meta.components);
  return {
    ...meta,
    description: description ?? meta.description,
    components: components ?? meta.components,
  };
}
