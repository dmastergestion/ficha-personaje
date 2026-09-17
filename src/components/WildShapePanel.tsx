import { Button } from "@/components/layout";
import { UsosContador } from "@/components/UsosContador";
import {
  convertirFormaEnEspacio,
  recuperarFormaConEspacio,
  WILD_RESURGENCE_SLOT_ID,
} from "@/rules/resource-use";
import {
  activarFormaSalvaje,
  bestiaFormaActiva,
  bestiaPorId,
  desactivarFormaSalvaje,
  etiquetaCr,
  formasConocidasPersonaje,
  nivelDruida,
  recursoFormaSalvaje,
  tieneBloqueCombate,
  tieneFormaSalvaje,
} from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";
import { useUiStore } from "@/stores/ui-store";

export function WildShapePanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  if (!tieneFormaSalvaje(character.identity.classes)) return null;

  const conocidas = formasConocidasPersonaje(character);
  const activa = bestiaFormaActiva(character);
  const recurso = recursoFormaSalvaje(character);
  const restantes = recurso ? Math.max(0, recurso.max - recurso.used) : 0;
  const max = recurso?.max ?? 0;
  const nivel = nivelDruida(character.identity.classes);
  const resurgimiento = character.resources.find((r) => r.id === WILD_RESURGENCE_SLOT_ID);
  const resurgimientoRestante = resurgimiento
    ? Math.max(0, resurgimiento.max - resurgimiento.used)
    : 0;

  function aplicarResurgimiento(
    result: { ok: true; character: Character; mensaje: string } | { ok: false; error: string },
  ) {
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    onChange(result.character);
    if (result.mensaje) useUiStore.getState().setUltimaTirada(null, result.mensaje);
  }

  function onSelect(beastId: string) {
    if (!beastId) {
      onChange(desactivarFormaSalvaje(character));
      return;
    }
    const next = activarFormaSalvaje(character, beastId);
    if ("error" in next) {
      window.alert(next.error);
      return;
    }
    onChange(next);
  }

  return (
    <div className="mb-3 space-y-2 rounded-lg border border-white/10 bg-surface/40 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Forma salvaje</p>
        {recurso ? <UsosContador restantes={restantes} max={max} /> : null}
      </div>
      <label className="block text-sm">
        <span className="text-muted">Forma activa</span>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-2 py-1"
          aria-label="Forma salvaje activa"
          value={character.combat.wildShapeBeastId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Humanoide (sin transformar)</option>
          {conocidas.map((id) => {
            const b = bestiaPorId(id);
            const combate = tieneBloqueCombate(b) ? "" : " · sin bloque de combate";
            return (
              <option key={id} value={id}>
                {b ? `${b.nameEs} (ID ${etiquetaCr(b.cr)})` : id}
                {combate}
              </option>
            );
          })}
        </select>
      </label>
      {activa?.combat && (
        <p className="text-xs text-muted">
          CA {activa.combat.ac} · Vel. {activa.combat.speed} pies · FUE {activa.combat.str} DES{" "}
          {activa.combat.dex} CON {activa.combat.con}
          {activa.combat.notes ? ` · ${activa.combat.notes}` : ""}
          {". Conservas tus PG; PG temp = nivel de druida."}
        </p>
      )}
      {activa && !activa.combat && (
        <p className="text-xs text-amber-200">
          No hay bloque de combate para esta bestia: anota CA y ataques a mano.
        </p>
      )}
      {activa && (
        <Button type="button" variant="ghost" className="text-xs" onClick={() => onSelect("")}>
          Terminar forma
        </Button>
      )}
      {nivel >= 5 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-white/10 pt-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-10 px-3 text-sm"
            disabled={!recurso || recurso.used <= 0}
            onClick={() => aplicarResurgimiento(recuperarFormaConEspacio(character))}
          >
            Espacio → forma
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-10 px-3 text-sm"
            disabled={resurgimientoRestante <= 0 || restantes <= 0}
            onClick={() => aplicarResurgimiento(convertirFormaEnEspacio(character))}
          >
            Forma → espacio 1
          </Button>
          {resurgimiento ? (
            <UsosContador restantes={resurgimientoRestante} max={resurgimiento.max} compact />
          ) : null}
        </div>
      )}
    </div>
  );
}
