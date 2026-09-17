import type { ClassLevel } from "@/schemas/character";
import { pulirTextoReglasEs } from "@/lib/rules-text-polish";
import { rasgosHastaNivel } from "@/rules/class-features";
import { useCatalogStore } from "@/stores/catalog-store";

export function ClassFeaturesPanel({ classes }: { classes: ClassLevel[] }) {
  const catalog = useCatalogStore((s) => s.catalog);

  return (
    <section className="sheet-card">
      <h3 className="sheet-section-title">Rasgos de clase</h3>
      <div className="space-y-2">
        {classes.map((cl) => {
          const list = rasgosHastaNivel(cl.classId, cl.level, cl.subclassId);
          if (list.length === 0) return null;
          return (
            <div key={cl.classId}>
              <p className="mb-1 text-sm font-medium">
                {catalog.t("classes", cl.classId, cl.classId)} (niv {cl.level})
              </p>
              <ul className="space-y-2 text-sm">
                {list.map((f) => (
                  <li
                    key={`${f.level}-${f.name}`}
                    id={`rasgo-${f.level}-${f.name}`}
                    className="rounded-lg border border-white/10 bg-surface/40 px-3 py-2"
                  >
                    <span className="font-semibold">
                      Niv {f.level}: {f.name}
                    </span>
                    <p className="sheet-prose mt-1">{pulirTextoReglasEs(f.description)}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
