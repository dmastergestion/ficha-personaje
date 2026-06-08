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
import { exportarFichaPdf } from "@/pdf/exportPdf";
import { descripcionClases } from "@/rules/multiclass";
import { useUiStore } from "@/stores/ui-store";

export function CharacterSheetPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
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
          <Button onClick={() => void exportarFichaPdf(character)}>PDF</Button>
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
