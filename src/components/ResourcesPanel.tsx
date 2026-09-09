import { Button } from "@/components/layout";
import {
  ajustarRecurso,
  etiquetaOrigenRecurso,
  poblarRecursosSugeridos,
} from "@/rules/resources-tracker";
import { otorgamientoPorRecursoLibre } from "@/rules/spell-grants";
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
  const visibles = character.resources.filter(
    (r) => !otorgamientoPorRecursoLibre(character, r.id),
  );

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
      ) : visibles.length === 0 ? (
        <p className="text-sm text-muted">
          Los usos de conjuros de rasgo (p. ej. Detectar magia) están en Hechizos, junto a Lanzar.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {visibles.map((r) => (
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
                {r.id.includes("lay-on-hands") ? (
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="number"
                      min={1}
                      max={r.max - r.used}
                      defaultValue={1}
                      className="sheet-input-compact w-12"
                      aria-label="Puntos de imposición a gastar"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const n = Number((e.target as HTMLInputElement).value);
                        if (Number.isFinite(n) && n > 0) {
                          onChange(ajustarRecurso(character, r.id, n));
                        }
                      }}
                    />
                    <Button
                      variant="danger"
                      className="px-2 py-0.5 text-xs"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector(
                          "input",
                        ) as HTMLInputElement | null);
                        const n = Number(input?.value ?? 1);
                        if (Number.isFinite(n) && n > 0) {
                          onChange(ajustarRecurso(character, r.id, n));
                        }
                      }}
                    >
                      Gastar
                    </Button>
                  </label>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
