import { Button } from "@/components/layout";
import { useDiceRollOptions } from "@/hooks/useDiceRollOptions";
import { tirarAtaqueCompleto } from "@/rules/attack-roll";
import {
  accionBarraCombate,
  ataquePorId,
} from "@/rules/attacks";
import { aplicarCambioPvConConcentracion } from "@/rules/combat-hp";
import { lanzarConjuro } from "@/rules/spell-cast";
import type { Character } from "@/schemas/character";
import type { SheetTab } from "@/pages/character-sheet/types";
import { useCatalogStore } from "@/stores/catalog-store";
import { useUiStore } from "@/stores/ui-store";

export function BottomCombatBar({
  character,
  onChange,
  onSelectTab,
  activeTab,
}: {
  character: Character;
  onChange: (next: Character) => void;
  onSelectTab: (tab: SheetTab) => void;
  activeTab?: SheetTab;
}) {
  const catalog = useCatalogStore((s) => s.catalog);
  const rollMode = useUiStore((s) => s.rollMode);
  const diceRoll = useDiceRollOptions();
  const setUltimaTirada = useUiStore((s) => s.setUltimaTirada);
  const setUltimoAtaque = useUiStore((s) => s.setUltimoAtaque);
  const accion = accionBarraCombate(character);
  const etiqueta =
    accion.tipo === "truco"
      ? catalog.t("spells", accion.id, accion.etiqueta)
      : accion.etiqueta;
  const enCombate = activeTab === "combate";

  function cambiarPv(delta: number) {
    if (delta === 0) return;
    if (delta < 0 && !diceRoll.isReady && character.spells.concentratingOn) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    const aplicado = aplicarCambioPvConConcentracion(
      character,
      delta,
      rollMode,
      diceRoll.options,
    );
    if (aplicado.deathMessage) setUltimaTirada(null, aplicado.deathMessage);
    if (aplicado.concentration) {
      const conc = aplicado.concentration;
      setUltimaTirada(
        conc.roll,
        conc.maintained
          ? `Concentración · CD ${conc.dc} · mantienes el conjuro`
          : `Concentración · CD ${conc.dc} · pierdes el conjuro`,
      );
    }
    onChange(aplicado.character);
  }

  function atacar() {
    if (!diceRoll.isReady) {
      setUltimaTirada(null, diceRoll.error);
      return;
    }
    if (accion.tipo === "truco") {
      const result = lanzarConjuro(character, 0, rollMode, {
        spellId: accion.id,
        requiereConcentracion: catalog.requiereConcentracion(accion.id),
        diceOptions: diceRoll.options,
      });
      if (!result.ok) {
        setUltimaTirada(null, result.error);
        return;
      }
      onChange(result.character);
      const partes = ["Truco"];
      if (result.damage) {
        const tipo = result.damage.type ? ` ${result.damage.type}` : "";
        partes.push(`Daño ${result.damage.formula} = ${result.damage.total}${tipo}`);
      }
      setUltimaTirada(result.roll, partes.join(" · "));
      return;
    }

    const attack = ataquePorId(character, accion.id);
    if (!attack) return;
    const result = tirarAtaqueCompleto(
      character,
      attack,
      rollMode,
      character.combat.conditionIds,
      character.combat.exhaustionLevel,
      null,
      diceRoll.options,
    );
    if ("error" in result) {
      setUltimaTirada(null, result.error);
      return;
    }
    setUltimoAtaque(result);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 px-2 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="flex items-center gap-1.5">
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="danger"
            className="px-1.5 py-1 text-xs"
            aria-label="Restar 5 PV"
            onClick={() => cambiarPv(-5)}
          >
            −5
          </Button>
          <Button
            variant="danger"
            className="px-1.5 py-1 text-xs"
            aria-label="Restar 1 PV"
            onClick={() => cambiarPv(-1)}
          >
            −1
          </Button>
          <span className="min-w-[3.75rem] px-0.5 text-center text-sm tabular-nums">
            {character.combat.hpCurrent}
            <span className="text-muted">/{character.combat.hpMax}</span>
          </span>
          <Button
            className="px-1.5 py-1 text-xs"
            aria-label="Sumar 1 PV"
            onClick={() => cambiarPv(1)}
          >
            +1
          </Button>
          <Button
            className="px-1.5 py-1 text-xs"
            aria-label="Sumar 5 PV"
            onClick={() => cambiarPv(5)}
          >
            +5
          </Button>
        </div>
        {!enCombate && (
          <Button className="shrink-0 px-2.5 py-1.5 text-sm" onClick={() => onSelectTab("combate")}>
            Combate
          </Button>
        )}
        <Button
          variant="combat"
          className="min-w-0 flex-1 truncate px-2 py-1.5 text-sm"
          onClick={atacar}
        >
          {accion.tipo === "truco" ? "Lanzar" : "Atacar"} · {etiqueta}
        </Button>
      </div>
    </div>
  );
}
