import { useState } from "react";
import { DAMAGE_TYPES } from "@/lib/constants";
import { resistenciasEspecie } from "@/rules/damage-resistances";
import { resistenciasObjetosMagicos } from "@/rules/inventory";
import type { Character } from "@/schemas/character";

function toggleType(list: string[], type: string, add: boolean): string[] {
  const lower = type.toLowerCase();
  if (add) {
    if (list.some((t) => t.toLowerCase() === lower)) return list;
    return [...list, type];
  }
  return list.filter((t) => t.toLowerCase() !== lower);
}

function TypeChips({
  label,
  list,
  onChange,
}: {
  label: string;
  list: string[];
  onChange: (next: string[]) => void;
}) {
  const [pick, setPick] = useState("");
  const disponibles = DAMAGE_TYPES.filter(
    (type) => !list.some((t) => t.toLowerCase() === type.toLowerCase()),
  );

  return (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      {list.length > 0 ? (
        <div className="mb-1 flex flex-wrap gap-1">
          {list.map((type) => (
            <button
              key={type}
              type="button"
              className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-xs text-muted"
              onClick={() => onChange(toggleType(list, type, false))}
              title="Quitar"
            >
              {type}
              <span className="text-accent/70">×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mb-1 text-xs text-muted/70">Ninguno</p>
      )}
      {disponibles.length > 0 && (
        <select
          className="w-full rounded border border-white/10 bg-panel px-2 py-1 text-xs"
          value={pick}
          onChange={(e) => {
            const type = e.target.value;
            if (!type) return;
            onChange(toggleType(list, type, true));
            setPick("");
          }}
        >
          <option value="">+ Añadir tipo…</option>
          {disponibles.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function DamageTypesEditor({
  character,
  onChange,
}: {
  character: Character;
  onChange: (next: Character) => void;
}) {
  const deEspecie = resistenciasEspecie(character.identity.speciesId);
  const deObjetos = resistenciasObjetosMagicos(character);
  return (
    <section className="rounded-xl border border-white/10 bg-panel p-3">
      <h3 className="mb-2 text-sm font-semibold">Daño (resistencias / vulnerabilidades / inmunidades)</h3>
      <p className="mb-2 text-xs text-muted">
        Especie y objetos se aplican solos al infligir daño. El desplegable es para extras (conjuros, etc.).
      </p>
      <div className="space-y-3">
        <TypeChips
          label="Resistencias"
          list={character.combat.damageResistances}
          onChange={(damageResistances) =>
            onChange({ ...character, combat: { ...character.combat, damageResistances } })
          }
        />
        {deEspecie.length > 0 && (
          <p className="text-xs text-muted">De especie: {deEspecie.join(", ")}</p>
        )}
        {deObjetos.length > 0 && (
          <p className="text-xs text-muted">De objetos sintonizados: {deObjetos.join(", ")}</p>
        )}
        <TypeChips
          label="Vulnerabilidades"
          list={character.combat.damageVulnerabilities}
          onChange={(damageVulnerabilities) =>
            onChange({ ...character, combat: { ...character.combat, damageVulnerabilities } })
          }
        />
        <TypeChips
          label="Inmunidades"
          list={character.combat.damageImmunities}
          onChange={(damageImmunities) =>
            onChange({ ...character, combat: { ...character.combat, damageImmunities } })
          }
        />
      </div>
    </section>
  );
}
