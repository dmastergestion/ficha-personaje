import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Layout } from "@/components/layout";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import type { Character } from "@/schemas/character";
import { SheetTabBar, TabResumen } from "@/pages/character-sheet/TabResumen";
import { TabCombate, TabEquipo } from "@/pages/character-sheet/TabCombate";
import { TabHechizos, TabNotas } from "@/pages/character-sheet/TabHechizos";
import type { SheetTab } from "@/pages/character-sheet/types";
import { t } from "@/rules/srd";

export function CharacterSheetPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [tab, setTab] = useState<SheetTab>("combate");

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
        <Link to="/">
          <Button>Volver</Button>
        </Link>
      }
    >
      <p className="mb-2 text-sm text-muted">
        {t("classes", character.identity.classId, character.identity.classId)} · Nivel{" "}
        {character.identity.level}
      </p>
      <SheetTabBar active={tab} onSelect={(id) => setTab(id as SheetTab)} />

      {tab === "resumen" && <TabResumen character={character} onChange={(n) => void persist(n)} />}
      {tab === "combate" && <TabCombate character={character} onChange={(n) => void persist(n)} />}
      {tab === "hechizos" && <TabHechizos character={character} onChange={(n) => void persist(n)} />}
      {tab === "equipo" && <TabEquipo character={character} onChange={(n) => void persist(n)} />}
      {tab === "notas" && <TabNotas character={character} onChange={(n) => void persist(n)} />}
    </Layout>
  );
}
