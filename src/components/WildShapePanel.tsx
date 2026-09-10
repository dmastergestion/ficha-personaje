import { Button } from "@/components/layout";
import {
  activarFormaSalvaje,
  bestiaFormaActiva,
  bestiaPorId,
  desactivarFormaSalvaje,
  etiquetaCr,
  formasConocidasPersonaje,
  recursoFormaSalvaje,
  tieneBloqueCombate,
  tieneFormaSalvaje,
} from "@/rules/wild-shape";
import type { Character } from "@/schemas/character";

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
  const usos = recurso ? `${Math.max(0, recurso.max - recurso.used)}/${recurso.max}` : "—";

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
    <div className="mb-3 space-y-2 rounded-lg border border-gold/30 bg-gold/5 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gold">Forma salvaje</p>
        <span className="text-xs text-muted">Usos {usos}</span>
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
          No hay bloque de combate SRD para esta bestia: anota CA y ataques a mano.
        </p>
      )}
      {activa && (
        <Button type="button" variant="ghost" className="text-xs" onClick={() => onSelect("")}>
          Terminar forma
        </Button>
      )}
    </div>
  );
}
