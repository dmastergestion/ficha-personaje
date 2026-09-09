import type { SpellCastMeta } from "@/rules/spell-cast-meta";
import { etiquetaSalvacion, etiquetaTipoConjuro } from "@/rules/spell-cast-meta";
import { textoDañoMostradoConjuro } from "@/rules/spell-cast";
import { metaConjuroParaMostrar } from "@/rules/spell-text";
import type { Character } from "@/schemas/character";

export function SpellInfoPanel({
  meta,
  name,
  spellId,
  character,
}: {
  meta: SpellCastMeta;
  name: string;
  spellId?: string | null;
  character?: Character;
}) {
  const display = metaConjuroParaMostrar(spellId, meta, character);
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
    const dice =
      character && spellId
        ? textoDañoMostradoConjuro(character, spellId, display.damage)
        : display.damage.dice;
    const dmg = display.damage.type ? `${dice} (${display.damage.type})` : dice;
    rows.push({ label: "Daño", value: dmg });
  }
  if (display.areaTags?.length) {
    rows.push({ label: "Área", value: display.areaTags.join(", ") });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-surface/50 p-3 text-sm">
      <p className="mb-2 font-semibold">{name}</p>
      {display.description && (
        <p className="sheet-prose mb-3">{display.description}</p>
      )}
      {rows.length > 0 && (
        <dl className="grid gap-1 text-xs sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-muted">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
