import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Layout } from "@/components/layout";
import { guardarPersonaje } from "@/db/repository";
import { crearPersonajeVacio } from "@/schemas/character";
import { obtenerClase, srdClasses, srdSpecies, t } from "@/rules/srd";

export function CharacterNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [classId, setClassId] = useState(srdClasses[0]?.id ?? "fighter");
  const [speciesId, setSpeciesId] = useState<string | null>(srdSpecies[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const clase = obtenerClase(classId);
    const character = crearPersonajeVacio({
      name: name.trim(),
      playerName: playerName.trim(),
      classId,
      speciesId,
    });

    if (clase) {
      character.combat.hitDie = clase.hitDie;
    }

    await guardarPersonaje(character);
    navigate(`/character/${character.id}`);
  }

  return (
    <Layout title="Nuevo personaje">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="mx-auto max-w-lg space-y-4 rounded-xl border border-white/10 bg-panel p-6"
      >
        <label className="block space-y-1">
          <span className="text-sm text-muted">Nombre del personaje</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Jugador</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Especie</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={speciesId ?? ""}
            onChange={(event) => setSpeciesId(event.target.value || null)}
          >
            {srdSpecies.map((species) => (
              <option key={species.id} value={species.id}>
                {t("species", species.id, species.nameEn)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Clase</span>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            {srdClasses.map((clase) => (
              <option key={clase.id} value={clase.id}>
                {t("classes", clase.id, clase.nameEn)}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="critical">
          Crear ficha
        </Button>
      </form>
    </Layout>
  );
}
