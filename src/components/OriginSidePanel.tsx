import { ClassFeaturesPanel } from "@/components/ClassFeaturesPanel";
import { BackgroundInfoPanel, SpeciesInfoPanel } from "@/components/OriginInfoPanel";
import type { GameCatalog } from "@/rules/catalog";
import { origenCatalogoDesdeIds } from "@/rules/origin-benefits";
import type { ClassLevel } from "@/schemas/character";

export function OriginSidePanel({
  catalog,
  speciesId,
  backgroundId,
  classes,
  subclassId,
  classId,
  level = 1,
}: {
  catalog: GameCatalog;
  speciesId: string | null;
  backgroundId: string | null;
  classes?: ClassLevel[];
  subclassId?: string | null;
  classId?: string;
  level?: number;
}) {
  const catalogo = origenCatalogoDesdeIds(
    speciesId,
    backgroundId,
    catalog.obtenerEspecie.bind(catalog),
    catalog.obtenerTrasfondo.bind(catalog),
  );
  const species = speciesId ? catalog.obtenerEspecie(speciesId) : undefined;
  const background = backgroundId ? catalog.obtenerTrasfondo(backgroundId) : undefined;
  const classLevels = classes ?? (classId ? [{ classId, subclassId: subclassId ?? null, level: 1 }] : []);

  return (
    <aside className="sticky top-4 space-y-3 rounded-xl border border-white/10 bg-surface/80 p-4 text-sm">
      <h3 className="font-semibold text-gold">Qué obtienes</h3>

      {!speciesId && !backgroundId && classLevels.length === 0 && (
        <p className="text-xs text-muted">Elige especie, trasfondo o clase para ver sus rasgos.</p>
      )}

      {speciesId && !species && (
        <p className="text-xs text-amber-300">
          No se encontraron datos de la especie «{catalog.t("species", speciesId, speciesId)}» en el
          catálogo.
        </p>
      )}

      {species && (
        <SpeciesInfoPanel
          species={species}
          name={catalog.t("species", speciesId!, species.nameEn)}
          speciesId={speciesId!}
          level={level}
          catalogo={catalogo}
        />
      )}

      {backgroundId && !background && (
        <p className="text-xs text-amber-300">
          No se encontraron datos del trasfondo «
          {catalog.t("backgrounds", backgroundId, backgroundId)}» en el catálogo.
        </p>
      )}

      {background && (
        <BackgroundInfoPanel
          background={background}
          name={catalog.t("backgrounds", backgroundId!, background.nameEn)}
          backgroundId={backgroundId!}
          level={level}
          catalogo={catalogo}
        />
      )}

      {classLevels.length > 0 && <ClassFeaturesPanel classes={classLevels} />}

      {subclassId && (
        <div className="rounded-lg border border-white/10 bg-panel/50 p-2 text-xs">
          <p className="font-semibold">
            Subclase: {catalog.t("subclasses", subclassId, subclassId)}
          </p>
          <p className="mt-1 text-muted">
            Los rasgos de subclase se desbloquean en juego (normalmente nivel 3).
          </p>
        </div>
      )}
    </aside>
  );
}
