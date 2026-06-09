import { useState } from "react";
import featMetaJson from "@/data/srd/feat-meta.json";
import { Button } from "@/components/layout";
import { descripcionDote as textoDote, nombreDote as nombreDoteTexto } from "@/rules/feat-text";
import type { CharacterFeat } from "@/schemas/character";

export type FeatMetaEntry = {
  name: string;
  nameEs: string;
  category: string;
  categoryLabel: string;
  description?: string;
  descriptionEs?: string;
  prerequisite?: string;
  repeatable?: boolean;
  srd52?: boolean;
};

const featMeta = featMetaJson as Record<string, FeatMetaEntry>;

const CATEGORY_ORDER = ["origin", "general", "fighting-style", "epic-boon"];

function labelFeat(entry: FeatMetaEntry): string {
  return entry.nameEs || entry.name;
}

export function nombreDote(id: string): string {
  const entry = featMeta[id];
  return entry ? labelFeat(entry) : nombreDoteTexto(id);
}

export function descripcionDote(id: string): string | undefined {
  return textoDote(id);
}

export function FeatPicker({
  feats,
  onAdd,
  onRemove,
}: {
  feats: CharacterFeat[];
  onAdd: (feat: CharacterFeat) => void;
  onRemove: (id: string) => void;
}) {
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    label: featMeta[Object.keys(featMeta).find((k) => featMeta[k]?.category === category) ?? ""]
      ?.categoryLabel ?? category,
    items: Object.entries(featMeta)
      .filter(([, m]) => m.category === category)
      .sort((a, b) => labelFeat(a[1]).localeCompare(labelFeat(b[1]), "es")),
  })).filter((g) => g.items.length > 0);

  const knownIds = new Set(feats.map((f) => f.id));
  const [pendingId, setPendingId] = useState("");

  function confirmarDote() {
    if (!pendingId || knownIds.has(pendingId)) return;
    const meta = featMeta[pendingId];
    if (!meta) return;
    onAdd({
      id: pendingId,
      name: labelFeat(meta),
      notes: textoDote(pendingId),
    });
    setPendingId("");
  }

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Dotes</h3>
      <ul className="mb-3 space-y-3 text-sm">
        {feats.map((feat) => {
          const meta = featMeta[feat.id];
          const desc = textoDote(feat.id, feat.notes);
          return (
            <li key={feat.id} className="rounded-lg border border-white/10 bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{feat.name}</span>
                  {meta?.prerequisite && (
                    <span className="ml-2 text-xs text-muted">({meta.prerequisite})</span>
                  )}
                  {meta?.repeatable && (
                    <span className="ml-1 rounded bg-white/10 px-1 text-[10px] text-muted">
                      Repetible
                    </span>
                  )}
                  {!meta?.srd52 && (
                    <span className="ml-1 rounded bg-gold/20 px-1 text-[10px] text-gold">PHB</span>
                  )}
                </div>
                <Button variant="ghost" onClick={() => onRemove(feat.id)}>
                  Quitar
                </Button>
              </div>
              {desc ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{desc}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin descripción en el catálogo.</p>
              )}
            </li>
          );
        })}
        {feats.length === 0 && <li className="text-xs text-muted">Sin dotes añadidas.</li>}
      </ul>
      <div className="space-y-2">
        <label className="block">
          <span className="sheet-field-label">Elegir dote</span>
          <select
            className="sheet-select"
            value={pendingId}
            onChange={(e) => setPendingId(e.target.value)}
          >
            <option value="">Selecciona para ver qué hace…</option>
            {byCategory.map((group) => (
              <optgroup key={group.category} label={group.label}>
                {group.items.map(([id, meta]) => (
                  <option key={id} value={id} disabled={knownIds.has(id)}>
                    {labelFeat(meta)}
                    {meta.prerequisite ? ` · ${meta.prerequisite}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {pendingId && (
          <div className="rounded-lg border border-white/10 bg-surface p-3 text-sm leading-relaxed text-muted">
            <p className="mb-1 font-medium text-white">{nombreDote(pendingId)}</p>
            <p className="whitespace-pre-wrap">{textoDote(pendingId) ?? "Sin descripción."}</p>
          </div>
        )}
        <Button
          variant="critical"
          disabled={!pendingId || knownIds.has(pendingId)}
          onClick={confirmarDote}
        >
          Añadir dote
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {Object.keys(featMeta).length} dotes PHB 2024 · {Object.values(featMeta).filter((f) => f.srd52).length}{" "}
        en SRD
      </p>
    </section>
  );
}
