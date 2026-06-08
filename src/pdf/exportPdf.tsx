import { pdf } from "@react-pdf/renderer";
import { calcularCaParaPdf, FichaPdfDocument } from "@/pdf/FichaPdfDocument";
import type { Character } from "@/schemas/character";

export async function exportarFichaPdf(character: Character): Promise<void> {
  const armorClass = calcularCaParaPdf(character);
  const blob = await pdf(
    <FichaPdfDocument character={character} armorClass={armorClass} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safe = character.identity.name.replace(/[^\w\s-]/g, "").trim() || "personaje";
  anchor.href = url;
  anchor.download = `ficha-${safe}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
