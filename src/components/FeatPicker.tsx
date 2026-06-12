import { useState } from "react";
import featMetaJson from "@/data/srd/feat-meta.json";
import { Button } from "@/components/layout";
import { FeatChoicesForm } from "@/components/FeatChoicesForm";
import {
  eleccionesPorDefectoDote,
  idInstanciaDote,
  metaMecanicaDote,
  sincronizarMecanicasDotes,
} from "@/rules/feat-mechanics";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { descripcionDote as textoDote, nombreDote as nombreDoteTexto } from "@/rules/feat-text";
import type { Character, CharacterFeat } from "@/schemas/character";

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

function aplicarCambioDotes(_character: Character, next: Character): Character {
  return poblarRecursosSugeridos(sincronizarMecanicasDotes(next));
}

export function FeatPicker({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const feats = character.feats;
  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    label: featMeta[Object.keys(featMeta).find((k) => featMeta[k]?.category === category) ?? ""]
      ?.categoryLabel ?? category,
    items: Object.entries(featMeta)
      .filter(([, m]) => m.category === category)
      .sort((a, b) => labelFeat(a[1]).localeCompare(labelFeat(b[1]), "es")),
  })).filter((g) => g.items.length > 0);

  const [pendingId, setPendingId] = useState("");

  function puedeAnadir(id: string): boolean {
    const meta = featMeta[id];
    if (!meta) return false;
    if (meta.repeatable) return true;
    return !feats.some((f) => f.id === id);
  }

  function confirmarDote() {
    if (!pendingId || !puedeAnadir(pendingId)) return;
    const meta = featMeta[pendingId];
    if (!meta) return;
    const feat: CharacterFeat = {
      id: pendingId,
      instanceId: crypto.randomUUID(),
      name: labelFeat(meta),
      notes: textoDote(pendingId),
      choices: eleccionesPorDefectoDote(pendingId),
    };
    onChange(aplicarCambioDotes(character, { ...character, feats: [...feats, feat] }));
    setPendingId("");
  }

  function quitar(instanceId: string) {
    onChange(
      aplicarCambioDotes(character, {
        ...character,
        feats: feats.filter((f) => idInstanciaDote(f) !== instanceId),
      }),
    );
  }

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Dotes</h3>
      <ul className="mb-2 space-y-2 text-sm">
        {feats.map((feat) => {
          const meta = featMeta[feat.id];
          const desc = textoDote(feat.id, feat.notes);
          const instanceId = idInstanciaDote(feat);
          const tieneMecanica = !!metaMecanicaDote(feat.id);
          return (
            <li key={instanceId} className="rounded-lg border border-white/10 bg-surface p-3">
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
                  {tieneMecanica && (
                    <span className="ml-1 rounded bg-gold/15 px-1 text-[10px] text-gold">
                      Mecánica activa
                    </span>
                  )}
                  {!meta?.srd52 && (
                    <span className="ml-1 rounded bg-gold/20 px-1 text-[10px] text-gold">PHB</span>
                  )}
                </div>
                <Button variant="ghost" onClick={() => quitar(instanceId)}>
                  Quitar
                </Button>
              </div>
              {desc ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{desc}</p>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin descripción en el catálogo.</p>
              )}
              <FeatChoicesForm
                character={character}
                feat={feat}
                onChange={(next) => onChange(aplicarCambioDotes(character, next))}
              />
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
                  <option key={id} value={id} disabled={!puedeAnadir(id)}>
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
          variant="primary"
          disabled={!pendingId || !puedeAnadir(pendingId)}
          onClick={confirmarDote}
        >
          Añadir dote
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Las dotes con mecánica activa aparecen en Recursos, Conjuros o pericias según corresponda.
      </p>
    </section>
  );
}
