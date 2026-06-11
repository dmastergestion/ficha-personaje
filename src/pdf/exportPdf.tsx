import { fillOfficialCharacterPdf } from "@/pdf/fillOfficialPdf";
import type { GameCatalog } from "@/rules/catalog";
import type { Character } from "@/schemas/character";

export async function exportarFichaPdf(
  character: Character,
  catalog: GameCatalog,
): Promise<void> {
  const bytes = await fillOfficialCharacterPdf(character, catalog);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safe = character.identity.name.replace(/[^\w\s-]/g, "").trim() || "personaje";
  anchor.href = url;
  anchor.download = `ficha-${safe}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
