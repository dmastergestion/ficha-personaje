import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { BottomCombatBar } from "@/components/BottomCombatBar";
import { CharacterIdentityBar } from "@/components/CharacterIdentityBar";
import { CharacterQuickStats } from "@/components/CharacterQuickStats";
import { LevelUpModal } from "@/components/LevelUpModal";
import { CollapsibleRollStrip } from "@/components/CollapsibleRollStrip";
import { ConditionStrip } from "@/components/ConditionStrip";
import { SaveIndicator, type SaveStatus } from "@/components/SaveIndicator";
import { Layout, buttonClassName } from "@/components/layout";
import { descripcionClases } from "@/rules/multiclass";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";
import { SheetTabBar } from "@/pages/character-sheet/SheetTabBar";
import type { SheetTab } from "@/pages/character-sheet/types";
import { useCharacterIdentityControls } from "@/hooks/useCharacterIdentityControls";

const TabCombate = lazy(() =>
  import("@/pages/character-sheet/TabCombate").then((m) => ({ default: m.TabCombate })),
);
const TabResumen = lazy(() =>
  import("@/pages/character-sheet/TabResumen").then((m) => ({ default: m.TabResumen })),
);
const TabHechizos = lazy(() =>
  import("@/pages/character-sheet/TabHechizos").then((m) => ({ default: m.TabHechizos })),
);
const TabEquipo = lazy(() =>
  import("@/pages/character-sheet/TabEquipo").then((m) => ({ default: m.TabEquipo })),
);
const TabNotas = lazy(() =>
  import("@/pages/character-sheet/TabNotas").then((m) => ({ default: m.TabNotas })),
);
const TabInformacion = lazy(() =>
  import("@/pages/character-sheet/TabInformacion").then((m) => ({ default: m.TabInformacion })),
);

function TabFallback() {
  return <p className="sheet-card text-sm text-muted">Cargando sección…</p>;
}

class SheetTabErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <p className="sheet-card text-sm text-red-300">
          No se pudo cargar esta sección ({this.state.error.message}). Prueba otra pestaña o recarga.
        </p>
      );
    }
    return this.props.children;
  }
}

export function CharacterSheetLoaded({
  character,
  catalog,
  tab,
  setTab,
  persist,
  saveStatus,
  errorGuardado,
  errorPdf,
  pdfDisponible,
  pdfTitle,
  exportandoPdf,
  onExportPdf,
}: {
  character: Character;
  catalog: GameCatalog;
  tab: SheetTab;
  setTab: (tab: SheetTab) => void;
  persist: (next: Character) => void;
  saveStatus: SaveStatus;
  errorGuardado: string | null;
  errorPdf: string | null;
  pdfDisponible: boolean | null;
  pdfTitle: string | undefined;
  exportandoPdf: boolean;
  onExportPdf: () => void;
}) {
  const identity = useCharacterIdentityControls(character, persist);
  const [identidadAbierta, setIdentidadAbierta] = useState(false);
  const especie = character.identity.speciesId
    ? catalog.t("species", character.identity.speciesId, character.identity.speciesId)
    : "sin especie";
  const resumenIdentidad = `${descripcionClases(character.identity.classes)} · ${especie}`;

  return (
    <>
      {identity.levelUpPreview && (
        <LevelUpModal
          preview={identity.levelUpPreview}
          character={character}
          pendingClasses={identity.pendingClasses ?? character.identity.classes}
          onConfirm={identity.confirmarSubidaNivel}
          onCancel={identity.cancelarSubidaNivel}
        />
      )}
      <Layout
        wide
        chrome="sheet"
        title={
          <input
            className="w-full min-w-0 truncate bg-transparent text-2xl font-bold text-cream outline-none placeholder:text-muted focus:border-b focus:border-accent/40"
            value={character.identity.name}
            placeholder="Nombre del personaje"
            aria-label="Nombre del personaje"
            onChange={(e) =>
              persist({
                ...character,
                identity: { ...character.identity, name: e.target.value },
              })
            }
          />
        }
        subtitle={
          <>
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-2 rounded-lg px-1 py-1 text-left text-sm text-muted hover:text-cream"
              aria-expanded={identidadAbierta}
              aria-label="Identidad del personaje"
              onClick={() => setIdentidadAbierta((v) => !v)}
            >
              <span className="min-w-0 flex-1 truncate">{resumenIdentidad}</span>
              <span className="shrink-0" aria-hidden>
                {identidadAbierta ? "▴" : "▾"}
              </span>
            </button>
            {identidadAbierta && (
              <CharacterIdentityBar
                character={character}
                catalog={catalog}
                onChange={persist}
                onClassChange={identity.onClassChange}
                onAddClass={identity.onAddClass}
                onOriginChange={(speciesId, backgroundId) =>
                  identity.onOriginChange(speciesId, backgroundId, catalog)
                }
                onLevelChange={identity.onLevelChange}
              />
            )}
            {identity.errorClases && (
              <p className="mt-1 text-sm text-red-300">{identity.errorClases}</p>
            )}
          </>
        }
        status={<SaveIndicator status={saveStatus} />}
        overflow={
          <button
            type="button"
            className={buttonClassName("ghost", "w-full justify-start px-3 py-1.5 text-sm")}
            disabled={exportandoPdf || pdfDisponible === false}
            title={pdfTitle}
            onClick={onExportPdf}
          >
            {exportandoPdf ? "PDF…" : "Exportar PDF"}
          </button>
        }
      >
        <div className={tab === "combate" ? "pb-4 lg:pb-4" : "pb-28 lg:pb-4"}>
          <div className="sheet-pdf-combat-stats">
            <CharacterQuickStats character={character} onChange={(n) => void persist(n)} />
          </div>

          <ConditionStrip character={character} onChange={(n) => void persist(n)} />

          <CollapsibleRollStrip />

          <SheetTabBar active={tab} onSelect={(id) => setTab(id as SheetTab)} />

          {errorGuardado && (
            <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              {errorGuardado}
            </p>
          )}

          {errorPdf && (
            <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              {errorPdf}
            </p>
          )}

          {pdfDisponible === false && !errorPdf && (
            <p className="mb-3 rounded-lg border border-white/10 bg-surface/50 px-3 py-2 text-xs text-muted">
              Export PDF desactivado: falta la plantilla oficial en{" "}
              <code className="text-cream/80">public/pdf/pj2024-template.pdf</code>. Ejecuta{" "}
              <code className="text-cream/80">npm run prepare:pdf-template</code>.
            </p>
          )}

          <SheetTabErrorBoundary key={tab}>
            <Suspense fallback={<TabFallback />}>
              <div
                id={`sheet-panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`sheet-tab-${tab}`}
              >
                {tab === "resumen" && (
                  <TabResumen character={character} onChange={(n) => void persist(n)} />
                )}
                {tab === "combate" && (
                  <TabCombate character={character} onChange={(n) => void persist(n)} />
                )}
                {tab === "hechizos" && (
                  <TabHechizos character={character} onChange={(n) => void persist(n)} />
                )}
                {tab === "equipo" && (
                  <TabEquipo character={character} onChange={(n) => void persist(n)} />
                )}
                {tab === "notas" && (
                  <TabNotas character={character} onChange={(n) => void persist(n)} />
                )}
                {tab === "informacion" && (
                  <TabInformacion character={character} onChange={(n) => void persist(n)} />
                )}
              </div>
            </Suspense>
          </SheetTabErrorBoundary>
        </div>

        <BottomCombatBar
          character={character}
          onChange={(n) => void persist(n)}
          onSelectTab={setTab}
          activeTab={tab}
        />
      </Layout>
    </>
  );
}
