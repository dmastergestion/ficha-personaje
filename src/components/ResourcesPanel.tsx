import { Button } from "@/components/layout";
import {
  ajustarRecurso,
  poblarRecursosSugeridos,
} from "@/rules/resources-tracker";
import type { Character } from "@/schemas/character";

export function ResourcesPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  return (
    <section className="sheet-card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Recursos de clase</h3>
        <Button
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => onChange(poblarRecursosSugeridos(character))}
        >
          Auto
        </Button>
      </div>
      {character.resources.length === 0 ? (
        <p className="text-xs text-muted">Pulsa Auto para cargar recursos según tus clases.</p>
      ) : (
        <ul className="space-y-2">
          {character.resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {r.name}
                <span className="ml-1 text-xs text-muted">
                  ({r.recharge === "short" ? "corto" : r.recharge === "long" ? "largo" : "—"})
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-xs tabular-nums">
                  {r.max - r.used}/{r.max}
                </span>
                <Button
                  variant="critical"
                  className="px-2 py-0.5 text-xs"
                  onClick={() => onChange(ajustarRecurso(character, r.id, 1))}
                >
                  −
                </Button>
                <Button
                  className="px-2 py-0.5 text-xs"
                  onClick={() => onChange(ajustarRecurso(character, r.id, -1))}
                >
                  +
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
