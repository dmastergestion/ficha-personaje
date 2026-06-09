import type { SpellCastMeta } from "@/rules/spell-cast-meta";
import { etiquetaSalvacion, etiquetaTipoConjuro } from "@/rules/spell-cast-meta";

export function SpellInfoPanel({ meta, name }: { meta: SpellCastMeta; name: string }) {
  const rows: { label: string; value: string }[] = [];

  if (meta.castingTime) rows.push({ label: "Tiempo", value: meta.castingTime });
  if (meta.range) rows.push({ label: "Alcance", value: meta.range });
  if (meta.components) rows.push({ label: "Componentes", value: meta.components });
  if (meta.duration) rows.push({ label: "Duración", value: meta.duration });
  rows.push({
    label: "Tirada",
    value:
      meta.tipo === "save" && meta.save
        ? `Salvación ${etiquetaSalvacion(meta.save)}`
        : etiquetaTipoConjuro(meta.tipo),
  });
  if (meta.ritual) rows.push({ label: "Ritual", value: "Sí" });
  if (meta.damage) {
    const dmg = meta.damage.type
      ? `${meta.damage.dice} (${meta.damage.type})`
      : meta.damage.dice;
    rows.push({ label: "Daño", value: dmg });
  }
  if (meta.areaTags?.length) {
    rows.push({ label: "Área", value: meta.areaTags.join(", ") });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-3 text-sm">
      <p className="mb-2 font-semibold">{name}</p>
      {rows.length > 0 && (
        <dl className="mb-2 grid gap-1 text-xs sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-muted">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {meta.description && (
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">{meta.description}</p>
      )}
    </div>
  );
}
