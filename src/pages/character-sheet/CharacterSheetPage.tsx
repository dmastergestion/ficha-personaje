import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BottomCombatBar } from "@/components/BottomCombatBar";
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
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const tab = useUiStore((s) => s.sheetTab);
  const setTab = useUiStore((s) => s.setSheetTab);

  useEffect(() => {
    if (!id) return;
    void obtenerPersonaje(id).then((value) => {
      if (value) setCharacter(value);
    });
  }, [id]);

  async function persist(next: Character) {
    setCharacter(next);
    await guardarPersonaje(next);
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
    return (
      <Layout title="Ficha">
        <p className="text-muted">Cargando ficha…</p>
      </Layout>
    );
  }

  return (
    <Layout
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
      <div className="pb-24 md:pb-0">
        <p className="mb-2 text-sm text-muted">
          {descripcionClases(character.identity.classes)} · Total {character.identity.level}
        </p>
        <SheetTabBar active={tab} onSelect={(id) => setTab(id as SheetTab)} />

        {tab === "resumen" && <TabResumen character={character} onChange={(n) => void persist(n)} />}
        {tab === "combate" && <TabCombate character={character} onChange={(n) => void persist(n)} />}
        {tab === "hechizos" && <TabHechizos character={character} onChange={(n) => void persist(n)} />}
        {tab === "equipo" && <TabEquipo character={character} onChange={(n) => void persist(n)} />}
        {tab === "notas" && <TabNotas character={character} onChange={(n) => void persist(n)} />}
      </div>

      <BottomCombatBar character={character} onSelectTab={setTab} />
    </Layout>
  );
}
