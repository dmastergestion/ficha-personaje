import { useEffect, useRef, useState } from "react";

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

import { TabCombate } from "@/pages/character-sheet/TabCombate";
import { TabEquipo } from "@/pages/character-sheet/TabEquipo";
import { TabHechizos } from "@/pages/character-sheet/TabHechizos";
import { TabNotas } from "@/pages/character-sheet/TabNotas";

import type { SheetTab } from "@/pages/character-sheet/types";

import { exportPdfHabilitado, plantillaPdfDisponible } from "@/pdf/pdfTemplate";

import { descripcionClases } from "@/rules/multiclass";

import { useCatalogStore } from "@/stores/catalog-store";

import { useUiStore } from "@/stores/ui-store";



async function exportarPdf(

  character: Character,

  catalog: ReturnType<typeof useCatalogStore.getState>["catalog"],

): Promise<void> {

  const { exportarFichaPdf } = await import("@/pdf/exportPdf");

  await exportarFichaPdf(character, catalog);

}



export function CharacterSheetPage() {

  const { id } = useParams();

  const [character, setCharacter] = useState<Character | null>(null);

  const [estado, setEstado] = useState<"cargando" | "listo" | "no-encontrado" | "error">(

    "cargando",

  );

  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const [exportandoPdf, setExportandoPdf] = useState(false);

  const [pdfDisponible, setPdfDisponible] = useState<boolean | null>(null);

  const tab = useUiStore((s) => s.sheetTab);

  const setTab = useUiStore((s) => s.setSheetTab);

  const catalog = useCatalogStore((s) => s.catalog);

  const saveQueueRef = useRef(Promise.resolve());



  useEffect(() => {

    if (!exportPdfHabilitado) return;

    void plantillaPdfDisponible().then(setPdfDisponible);

  }, []);



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

    setCharacter(next);

    const run = saveQueueRef.current.then(() => guardarPersonaje(next));

    saveQueueRef.current = run.catch(() => {});

    try {

      await run;

      setErrorGuardado(null);

    } catch (err) {

      console.error("No se pudo guardar la ficha", err);

      setErrorGuardado(

        err instanceof Error ? err.message : "No se pudieron guardar los cambios.",

      );

      if (id) {

        const fresh = await obtenerPersonaje(id);

        if (fresh) setCharacter(fresh);

      }

    }

  }



  async function onExportPdf() {

    if (!character || exportandoPdf) return;

    if (pdfDisponible === false) {

      setErrorPdf(

        "Plantilla PDF no encontrada. En local ejecuta: npm run prepare:pdf-template",

      );

      return;

    }

    setExportandoPdf(true);

    setErrorPdf(null);

    try {

      await exportarPdf(character, catalog);

    } catch (err) {

      console.error("No se pudo exportar el PDF", err);

      setErrorPdf(

        err instanceof Error ? err.message : "No se pudo exportar el PDF.",

      );

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



  const pdfTitle =

    pdfDisponible === false

      ? "Requiere plantilla PDF (npm run prepare:pdf-template)"

      : undefined;



  return (

    <Layout

      wide

      title={character.identity.name}

      actions={

        <>

          {exportPdfHabilitado && (

            <Button

              disabled={exportandoPdf || pdfDisponible === false}

              title={pdfTitle}

              onClick={() => void onExportPdf()}

            >

              {exportandoPdf ? "PDF…" : "PDF"}

            </Button>

          )}

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

        {exportPdfHabilitado && errorPdf && (

          <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">

            {errorPdf}

          </p>

        )}

        {exportPdfHabilitado && pdfDisponible === false && !errorPdf && (

          <p className="mb-3 rounded-lg border border-white/10 bg-surface/50 px-3 py-2 text-xs text-muted">

            Export PDF desactivado: falta la plantilla oficial en{" "}

            <code className="text-white/80">public/pdf/pj2024-template.pdf</code>.

            {" "}Ejecuta <code className="text-white/80">npm run prepare:pdf-template</code>.

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


