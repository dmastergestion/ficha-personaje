import { InfoTrigger } from "@/components/InfoTrigger";
import { ResourceInfoPanel } from "@/components/ResourceInfoPanel";
import { t } from "@/rules/srd";
import {
  armasElegiblesMaestria,
  maestriasArmasValidas,
  ranurasMaestriaTotales,
  resumenMaestriaArma,
  textoMaestriaArma,
} from "@/rules/weapon-mastery";
import type { Character } from "@/schemas/character";

export function WeaponMasteryPanel({
  character,
  onChange,
  compact = false,
}: {
  character: Character;
  onChange?: (next: Character) => void;
  compact?: boolean;
}) {
  const slots = ranurasMaestriaTotales(character.identity.classes);
  if (slots === 0) return null;

  const eligible = armasElegiblesMaestria(character);
  const editable = !!onChange;
  const picks = character.weaponMasteries;

  function setPick(index: number, weaponId: string) {
    if (!onChange) return;
    const next = [...picks];
    while (next.length < slots) next.push("");
    next[index] = weaponId;
    const cleaned = next.filter(Boolean);
    onChange({ ...character, weaponMasteries: cleaned });
  }

  const incomplete = picks.length < slots;

  return (
    <section className={compact ? "space-y-2" : "sheet-card"}>
      {!compact && <h3 className="sheet-section-title">Maestrías de arma</h3>}
      <p className="text-sm text-muted">
        Elige {slots} tipo{slots > 1 ? "s" : ""} de arma. Puedes cambiar una tras descanso largo.
      </p>
      <div className="space-y-3">
        {Array.from({ length: slots }, (_, index) => {
          const weaponId = picks[index];
          const texto = weaponId ? textoMaestriaArma(weaponId) : null;
          return (
            <label key={index} className="block space-y-1 text-sm">
            <span className="flex items-center gap-1 text-muted">
              Arma {index + 1}
              {texto ? (
                <InfoTrigger
                  tip={texto.resumen}
                  title={texto.label}
                  panel={<ResourceInfoPanel texto={texto.descripcion} />}
                  className="h-5 w-5 shrink-0 text-[10px]"
                />
              ) : null}
            </span>
            {editable ? (
              <select
                className="sheet-select"
                value={picks[index] ?? ""}
                onChange={(e) => setPick(index, e.target.value)}
              >
                <option value="">— Elegir —</option>
                {eligible.map((weapon) => (
                  <option key={weapon.id} value={weapon.id}>
                    {t("weapons", weapon.id, weapon.nameEn)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium">
                {picks[index] ? resumenMaestriaArma(picks[index]!) : "—"}
              </p>
            )}
            </label>
          );
        })}
      </div>
      {editable && incomplete && (
        <p className="text-sm text-amber-400/90">Completa todas las maestrías de arma.</p>
      )}
      {editable && picks.length > 0 && !maestriasArmasValidas(character, picks).valid && (
        <p className="text-xs text-red-400">{maestriasArmasValidas(character, picks).message}</p>
      )}
      {!editable && picks.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs text-muted">
          {picks.map((id) => (
            <li key={id}>{resumenMaestriaArma(id)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
