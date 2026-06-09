import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BottomCombatBar } from "@/components/BottomCombatBar";
import { CharacterQuickStats } from "@/components/CharacterQuickStats";
import { FloatingRollPanel } from "@/components/FloatingRollPanel";
import { RollResultsPanel } from "@/components/RollResultsPanel";
import { RollSettingsBar } from "@/components/RollSettingsBar";
import { Button, Layout } from "@/components/layout";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import type { Character } from "@/schemas/character";
import { SheetTabBar, TabResumen } from "@/pages/character-sheet/TabResumen";
import { TabCombate, TabEquipo } from "@/pages/character-sheet/TabCombate";
import { TabHechizos, TabNotas } from "@/pages/character-sheet/TabHechizos";
import type { SheetTab } from "@/pages/character-sheet/types";
import { descripcionClases } from "@/rules/multiclass";
import { useUiStore } from "@/stores/ui-store";

async function exportarPdf(character: Character): Promise<void> {
  const { exportarFichaPdf } = await import("@/pdf/exportPdf");
  await exportarFichaPdf(character);
}

export function CharacterSheetPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-encontrado" | "error">(
    "cargando",
  );
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const tab = useUiStore((s) => s.sheetTab);
  const setTab = useUiStore((s) => s.setSheetTab);

  useEffect(() => {
    if (!id) {
      setEstado("no-encontrado");
      return;
    }
    let cancelado = false;
    setEstado("cargando");
    obtenerPersonaje(id)
      .then((value) => {
        if (cancelado) return;
        if (value) {
          setCharacter(value);
          setEstado("listo");
        } else {
          setEstado("no-encontrado");
        }
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("No se pudo cargar la ficha", err);
        setEstado("error");
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function persist(next: Character) {
    const previo = character;
    setCharacter(next);
    try {
      await guardarPersonaje(next);
      setErrorGuardado(null);
    } catch (err) {
      console.error("No se pudo guardar la ficha", err);
      setCharacter(previo);
      setErrorGuardado(
        err instanceof Error ? err.message : "No se pudieron guardar los cambios.",
      );
    }
  }

  async function onExportPdf() {
    if (!character || exportandoPdf) return;
    setExportandoPdf(true);
    try {
      await exportarPdf(character);
    } finally {
      setExportandoPdf(false);
    }
  }

  if (!character) {
    if (estado === "no-encontrado") {
      return (
        <Layout title="Ficha">
          <div className="space-y-3">
            <p className="text-muted">No se encontró esta ficha.</p>
            <Link to="/" className="text-accent underline">
              Volver a la lista de personajes
            </Link>
          </div>
        </Layout>
      );
    }
    if (estado === "error") {
      return (
        <Layout title="Ficha">
          <div className="space-y-3">
            <p className="text-red-400">Hubo un error al cargar la ficha.</p>
            <Link to="/" className="text-accent underline">
              Volver a la lista de personajes
            </Link>
          </div>
        </Layout>
      );
    }
    return (
      <Layout title="Ficha">
        <p className="text-muted">Cargando ficha…</p>
      </Layout>
    );
  }

  return (
    <Layout
      wide
      title={character.identity.name}
      actions={
        <>
          <Button disabled={exportandoPdf} onClick={() => void onExportPdf()}>
            {exportandoPdf ? "PDF…" : "PDF"}
          </Button>
          <Link to="/">
            <Button>Volver</Button>
          </Link>
        </>
      }
    >
      <div className="pb-28 lg:pb-4">
        <p className="mb-3 text-sm text-muted">
          {descripcionClases(character.identity.classes)} · Nivel {character.identity.level}
          {character.identity.playerName ? ` · ${character.identity.playerName}` : ""}
        </p>
        <CharacterQuickStats character={character} />
        <SheetTabBar active={tab} onSelect={(id) => setTab(id as SheetTab)} />
        {errorGuardado && (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            {errorGuardado}
          </p>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-4 lg:hidden">
              <RollSettingsBar compact />
            </div>

            {tab === "resumen" && (
              <TabResumen character={character} onChange={(n) => void persist(n)} />
            )}
            {tab === "combate" && (
              <TabCombate character={character} onChange={(n) => void persist(n)} />
            )}
            {tab === "hechizos" && (
              <TabHechizos character={character} onChange={(n) => void persist(n)} />
            )}
            {tab === "equipo" && <TabEquipo character={character} onChange={(n) => void persist(n)} />}
            {tab === "notas" && <TabNotas character={character} onChange={(n) => void persist(n)} />}
          </div>

          <aside className="sheet-sidebar" aria-label="Panel de tiradas">
            <RollSettingsBar compact />
            <div className="sheet-sidebar-panel">
              <RollResultsPanel />
            </div>
          </aside>
        </div>
      </div>

      <FloatingRollPanel />
      <BottomCombatBar character={character} onSelectTab={setTab} />
    </Layout>
  );
}
