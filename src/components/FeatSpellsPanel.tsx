import { useState } from "react";
import { Button } from "@/components/layout";
import { SpellInfoPanel } from "@/components/SpellInfoPanel";
import { EtiquetaConcentracion, EtiquetaRitual } from "@/components/spell/SpellRow";
import { conjurosOtorgadosPorDotes, type FeatSpellGrant } from "@/rules/feat-mechanics";
import {
  cdConjuroParaAtributo,
  lanzarConjuro,
  modificadorAtaqueConjuroParaAtributo,
} from "@/rules/spell-cast";
import { etiquetaSalvacion, metaTiradaConjuro } from "@/rules/spell-cast-meta";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { useUiStore } from "@/stores/ui-store";

export function FeatSpellsPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const grants = conjurosOtorgadosPorDotes(character);
  const [infoId, setInfoId] = useState<string | null>(null);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);

  if (grants.length === 0) return null;

  function lanzar(grant: FeatSpellGrant) {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const spell = catalog.spells.find((s) => s.id === grant.spellId);
    const concentracion = catalog.requiereConcentracion(grant.spellId);
    const resource = grant.freeResourceId
      ? character.resources.find((r) => r.id === grant.freeResourceId)
      : undefined;
    const canUseResource =
      grant.level > 0 && resource && resource.used < resource.max;

    const result = lanzarConjuro(character, grant.level, rollMode, {
      spellId: grant.spellId,
      requiereConcentracion: concentracion,
      diceOptions: diceRoll.options,
      abilityKeyOverride: grant.abilityKey,
      featResourceId: canUseResource ? grant.freeResourceId : undefined,
    });

    if (result.ok) {
      onChange(result.character);
      const mod = modificadorAtaqueConjuroParaAtributo(character, grant.abilityKey);
      const cd = cdConjuroParaAtributo(character, grant.abilityKey);
      const meta = metaTiradaConjuro(grant.spellId, spell);
      const parts = [grant.level === 0 ? "Truco (dote)" : (result.slotGastado ?? "Lanzado")];
      if (meta.tipo === "attack") {
        parts.push(`Ataque ${mod >= 0 ? `+${mod}` : mod}`);
      } else if (meta.tipo === "save") {
        parts.push(`Salvación ${meta.save ? etiquetaSalvacion(meta.save) : ""} CD ${cd}`.trim());
      } else {
        parts.push(`CD ${cd}`);
      }
      setUltimaTirada(result.roll, parts.join(" · "));
    } else {
      setUltimaTirada(null, result.error);
    }
  }

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Conjuros de dotes</h3>
      <p className="mb-2 text-xs text-muted">
        Concedidos por dotes (p. ej. Iniciado en la magia). Los trucos no gastan espacios; el conjuro
        de nivel 1 puede usarse sin espacio si queda el recurso de la dote.
      </p>
      <ul className="space-y-2">
        {grants.map((grant) => {
          const nombre = catalog.t("spells", grant.spellId, grant.spellId);
          const resource = grant.freeResourceId
            ? character.resources.find((r) => r.id === grant.freeResourceId)
            : undefined;
          return (
            <li
              key={`${grant.featInstanceId}-${grant.spellId}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium">{nombre}</span>
                <span className="ml-2 text-xs text-muted">
                  {grant.level === 0 ? "Truco" : "Niv. 1"} · {grant.listLabel} · {grant.featName}
                </span>
                <EtiquetaRitual spellId={grant.spellId} />
                <EtiquetaConcentracion spellId={grant.spellId} />
                {resource && (
                  <span className="ml-2 text-xs text-muted">
                    Sin espacio: {resource.max - resource.used}/{resource.max}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" className="px-2 py-0.5 text-xs" onClick={() => setInfoId(grant.spellId)}>
                  Info
                </Button>
                <Button className="px-2 py-0.5 text-xs" onClick={() => lanzar(grant)}>
                  Lanzar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {infoId && (
        <div className="mt-2">
          <SpellInfoPanel
            spellId={infoId}
            name={catalog.t("spells", infoId, infoId)}
            meta={metaTiradaConjuro(infoId, catalog.obtenerConjuro(infoId))}
          />
          <Button variant="ghost" className="mt-2 text-xs" onClick={() => setInfoId(null)}>
            Cerrar
          </Button>
        </div>
      )}
    </section>
  );
}
