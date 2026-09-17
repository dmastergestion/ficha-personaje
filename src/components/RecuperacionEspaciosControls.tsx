import { InfoTrigger } from "@/components/InfoTrigger";
import { ResourceInfoPanel } from "@/components/ResourceInfoPanel";
import { UsosContador } from "@/components/UsosContador";
import { Button } from "@/components/layout";
import { descripcionRecurso, resumenRecurso } from "@/rules/resource-text";
import type { ResultadoRecursoClase } from "@/rules/resource-use";
import type { Character } from "@/schemas/character";
import { useUiStore } from "@/stores/ui-store";

/** Botón de Hechizos para rasgo 1/descanso que recupera espacios (arcana, pacto…). */
export function RecuperacionEspaciosControls({
  character,
  onChange,
  resourceId,
  classId,
  minLevel,
  titulo,
  fallbackTexto,
  accion,
  usar,
}: {
  character: Character;
  onChange: (next: Character) => void;
  resourceId: string;
  classId: string;
  minLevel: number;
  titulo: string;
  fallbackTexto: string;
  accion: string;
  usar: (character: Character) => ResultadoRecursoClase;
}) {
  const recurso = character.resources.find((r) => r.id === resourceId);
  const nivelClase = character.identity.classes.find((c) => c.classId === classId)?.level ?? 0;
  if (nivelClase < minLevel && !recurso) return null;

  const restantes = recurso ? Math.max(0, recurso.max - recurso.used) : 1;
  const texto = (recurso ? descripcionRecurso(character, recurso) : null) ?? fallbackTexto;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
      <span className="inline-flex min-w-0 items-center gap-0.5 text-sm font-medium">
        {titulo}
        <InfoTrigger
          tip={resumenRecurso(texto)}
          title={titulo}
          panel={<ResourceInfoPanel recarga="descanso largo" texto={texto} />}
          className="h-5 w-5 shrink-0 text-[10px]"
        />
      </span>
      <UsosContador restantes={restantes} max={recurso?.max ?? 1} compact />
      <Button
        variant="primary"
        className="min-h-10 px-3 text-sm"
        disabled={restantes <= 0}
        onClick={() => {
          const result = usar(character);
          if (!result.ok) {
            useUiStore.getState().setUltimaTirada(null, result.error);
            return;
          }
          onChange(result.character);
          useUiStore.getState().setUltimaTirada(null, result.mensaje);
        }}
      >
        {accion}
      </Button>
    </div>
  );
}
