import { Button } from "@/components/layout";
import {
  ajustarRecurso,
  etiquetaOrigenRecurso,
  poblarRecursosSugeridos,
} from "@/rules/resources-tracker";
import type { Character } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";

function etiquetaOrigen(r: Character["resources"][number], catalog: ReturnType<typeof useCatalogStore.getState>["catalog"]): string {
  const base = etiquetaOrigenRecurso(r.source ?? "class");
  if (r.source === "class" && r.sourceLabel) {
    return `${base} · ${catalog.t("classes", r.sourceLabel, r.sourceLabel)}`;
  }
  if (r.source === "feat" && r.sourceLabel) {
    return `${base} · ${r.sourceLabel}`;
  }
  if (r.source === "species" && r.sourceLabel) {
    return `${base} · ${catalog.t("species", r.sourceLabel, r.sourceLabel)}`;
  }
  if (r.sourceLabel) return `${base} · ${r.sourceLabel}`;
  return base;
}

export function ResourcesPanel({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const catalog = useCatalogStore((s) => s.catalog);

  return (
    <section className="sheet-card">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight">Recursos</h3>
        <Button
          variant="ghost"
          className="px-2 py-1 text-xs"
          onClick={() => onChange(poblarRecursosSugeridos(character))}
        >
          Auto
        </Button>
      </div>
      {character.resources.length === 0 ? (
        <p className="text-xs text-muted">
          Pulsa Auto para cargar usos de clase, especie y rasgos limitados.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {character.resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {r.name}
                <span className="ml-1 block truncate text-xs text-muted">
                  {etiquetaOrigen(r, catalog)}
                  {" · "}
                  {r.recharge === "short"
                    ? "descanso corto"
                    : r.recharge === "long"
                      ? "descanso largo"
                      : "sin recarga"}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-xs tabular-nums">
                  {r.max - r.used}/{r.max}
                </span>
                <Button
                  variant="danger"
                  className="px-2 py-0.5 text-xs"
                  disabled={r.recharge === "none"}
                  onClick={() => onChange(ajustarRecurso(character, r.id, 1))}
                >
                  −
                </Button>
                <Button
                  className="px-2 py-0.5 text-xs"
                  disabled={r.recharge === "none" || r.used <= 0}
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
