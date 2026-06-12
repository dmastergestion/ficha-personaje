import {
  INSPIRACION_HEROICA_DESCRIPCION,
} from "@/rules/heroic-inspiration";

export function HeroicInspirationInfoPanel() {
  return (
    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
      {INSPIRACION_HEROICA_DESCRIPCION}
    </p>
  );
}
