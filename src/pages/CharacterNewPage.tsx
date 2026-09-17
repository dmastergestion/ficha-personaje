import { OriginSidePanel } from "@/components/OriginSidePanel";
import { SpellChoicesForm } from "@/components/SpellChoicesForm";
import { Button, Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { PasoAtributos } from "@/pages/character-new/PasoAtributos";
import { PasoClase } from "@/pages/character-new/PasoClase";
import { PasoIdentidad } from "@/pages/character-new/PasoIdentidad";
import { PasoOrigen } from "@/pages/character-new/PasoOrigen";
import { PasoResumen } from "@/pages/character-new/PasoResumen";
import { useAsistenteCreacion } from "@/pages/character-new/useAsistenteCreacion";

export function CharacterNewPage() {
  const asistente = useAsistenteCreacion();
  const muestraPanelLateral = asistente.pasoActual === "origen" || asistente.pasoActual === "clase";

  return (
    <Layout title="Nuevo personaje" wide={muestraPanelLateral}>
      <p className="mb-2 text-sm text-muted">
        Paso {asistente.paso + 1} de {asistente.pasos.length}: {asistente.pasos[asistente.paso]?.titulo}
      </p>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Pasos del asistente">
        {asistente.pasos.map((p, index) => {
          const activo = index === asistente.paso;
          const completado = index < asistente.paso;
          return (
            <button
              key={p.id}
              type="button"
              aria-current={activo ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                activo && "bg-accent font-semibold text-ink",
                completado &&
                  "border border-accent/40 text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                !activo &&
                  !completado &&
                  "border border-white/10 text-muted hover:border-white/20 hover:text-cream",
              )}
              onClick={() => asistente.irAPaso(index)}
            >
              <span className="tabular-nums">{index + 1}</span>
              <span>{p.titulo}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={cn(
          "mx-auto rounded-xl border border-white/10 bg-panel p-6",
          muestraPanelLateral ? "grid max-w-5xl gap-6 lg:grid-cols-[1fr,18rem]" : "max-w-xl",
        )}
      >
        <div className="min-w-0">
          {asistente.pasoActual === "identidad" && (
            <PasoIdentidad datos={asistente.datos} actualizar={asistente.actualizar} />
          )}

          {asistente.pasoActual === "origen" && (
            <PasoOrigen
              catalog={asistente.catalog}
              datos={asistente.datos}
              actualizar={asistente.actualizar}
              catalogoOrigen={asistente.origen.catalogoOrigen}
              originChoices={asistente.origen.originChoices}
              beneficiosOrigen={asistente.origen.beneficiosOrigen}
            />
          )}

          {asistente.pasoActual === "clase" && (
            <PasoClase
              catalog={asistente.catalog}
              datos={asistente.datos}
              actualizar={asistente.actualizar}
              originChoices={asistente.origen.originChoices}
              subclasesFiltradas={asistente.clase.subclasesFiltradas}
              clasesConjuro={asistente.clase.clasesConjuro}
              eleccionEquipoClase={asistente.clase.eleccionEquipoClase}
              resumenEquipoClaseActual={asistente.clase.resumenEquipoClaseActual}
              borradorMaestrias={asistente.clase.borradorMaestrias}
              spellSelectionCantrips={asistente.conjuros.spellSelection.cantripsKnown}
            />
          )}

          {asistente.pasoActual === "atributos" && (
            <PasoAtributos
              datos={asistente.datos}
              actualizar={asistente.actualizar}
              catalogoOrigen={asistente.origen.catalogoOrigen}
              originChoices={asistente.origen.originChoices}
              {...asistente.atributos}
            />
          )}

          {asistente.pasoActual === "conjuros" && (
            <SpellChoicesForm
              classes={asistente.clase.clasesConjuro}
              seleccion={asistente.conjuros.spellSelection}
              onChange={asistente.conjuros.setSpellSelection}
              catalog={asistente.catalog}
              titulo="Conjuros iniciales"
              idsExcluidos={asistente.conjuros.idsExcluidosConjuros}
              originChoices={asistente.origen.originChoices}
            />
          )}

          {asistente.pasoActual === "resumen" && (
            <PasoResumen
              catalog={asistente.catalog}
              datos={asistente.datos}
              actualizar={asistente.actualizar}
              catalogoOrigen={asistente.origen.catalogoOrigen}
              originChoices={asistente.origen.originChoices}
              beneficiosOrigen={asistente.origen.beneficiosOrigen}
              atributosFinales={asistente.origen.atributosFinales}
            />
          )}

          {asistente.error && <p className="mt-4 text-sm text-red-400">{asistente.error}</p>}

          <div className="mt-6 flex justify-between gap-2">
            <Button type="button" variant="ghost" disabled={asistente.paso === 0} onClick={asistente.anterior}>
              Anterior
            </Button>
            {asistente.paso < asistente.pasos.length - 1 ? (
              <Button type="button" variant="primary" onClick={asistente.siguiente}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                disabled={asistente.creando}
                onClick={() => void asistente.crear()}
              >
                {asistente.creando ? "Guardando…" : "Crear ficha"}
              </Button>
            )}
          </div>
        </div>

        {muestraPanelLateral && (
          <OriginSidePanel
            catalog={asistente.catalog}
            speciesId={asistente.datos.speciesId}
            backgroundId={asistente.datos.backgroundId}
            level={asistente.datos.level}
            classId={asistente.pasoActual === "clase" ? asistente.datos.classId : undefined}
            subclassId={asistente.pasoActual === "clase" ? asistente.datos.subclassId : undefined}
            classes={
              asistente.pasoActual === "clase"
                ? [
                    {
                      classId: asistente.datos.classId,
                      subclassId: asistente.datos.subclassId,
                      level: asistente.datos.level,
                    },
                  ]
                : undefined
            }
          />
        )}
      </div>
    </Layout>
  );
}
