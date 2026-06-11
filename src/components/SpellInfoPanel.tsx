import type { SpellCastMeta } from "@/rules/spell-cast-meta";
import { etiquetaSalvacion, etiquetaTipoConjuro } from "@/rules/spell-cast-meta";
import { metaConjuroParaMostrar } from "@/rules/spell-text";

export function SpellInfoPanel({
  meta,
  name,
  spellId,
}: {
  meta: SpellCastMeta;
  name: string;
  spellId?: string | null;
}) {
  const display = metaConjuroParaMostrar(spellId, meta);
  const rows: { label: string; value: string }[] = [];

  if (display.castingTime) rows.push({ label: "Tiempo", value: display.castingTime });
  if (display.range) rows.push({ label: "Alcance", value: display.range });
  if (display.components) rows.push({ label: "Componentes", value: display.components });
  if (display.duration) rows.push({ label: "Duración", value: display.duration });
  rows.push({
    label: "Tirada",
    value:
      display.tipo === "save" && display.save
        ? `Salvación ${etiquetaSalvacion(display.save)}`
        : etiquetaTipoConjuro(display.tipo),
  });
  if (display.ritual) rows.push({ label: "Ritual", value: "Sí" });
  if (display.damage) {
    const dmg = display.damage.type
      ? `${display.damage.dice} (${display.damage.type})`
      : display.damage.dice;
    rows.push({ label: "Daño", value: dmg });
  }
  if (display.areaTags?.length) {
    rows.push({ label: "Área", value: display.areaTags.join(", ") });
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
      {display.description && (
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">{display.description}</p>
      )}
    </div>
  );
}
