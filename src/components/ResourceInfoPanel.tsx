import { pulirTextoReglasEs } from "@/lib/rules-text-polish";

export function ResourceInfoPanel({
  origen,
  recarga,
  texto,
}: {
  origen?: string;
  recarga?: string;
  texto: string;
}) {
  const meta = [origen, recarga].filter(Boolean).join(" · ");
  return (
    <div className="space-y-2 text-sm">
      {meta ? <p className="text-xs text-muted">{meta}</p> : null}
      <p className="sheet-prose whitespace-pre-wrap">{pulirTextoReglasEs(texto)}</p>
    </div>
  );
}
