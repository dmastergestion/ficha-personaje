import { useEffect, useRef, useState } from "react";
import { guardarPersonaje, obtenerPersonaje } from "@/db/repository";
import { hayQueSincronizarRecursos, poblarRecursosSugeridos } from "@/rules/resources-tracker";
import type { Character } from "@/schemas/character";
import type { SaveStatus } from "@/components/SaveIndicator";

export type SheetLoadState = "cargando" | "listo" | "no-encontrado" | "error";

const DEBOUNCE_MS = 400;
const SAVED_FADE_MS = 2000;

export function useCharacterSheetPersistence(id: string | undefined) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [estado, setEstado] = useState<SheetLoadState>("cargando");
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveQueueRef = useRef(Promise.resolve());
  const saveFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Character | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(id);
  idRef.current = id;

  useEffect(() => {
    if (!id) {
      setEstado("no-encontrado");
      return;
    }

    let cancelado = false;
    setEstado("cargando");

    obtenerPersonaje(id)
      .then((value) => {
        if (cancelado) return;
        if (value) {
          const synced = poblarRecursosSugeridos(value);
          setCharacter(synced);
          setEstado("listo");
          if (hayQueSincronizarRecursos(value)) {
            const run = saveQueueRef.current.then(() => guardarPersonaje(synced));
            saveQueueRef.current = run.catch((err) => {
              console.error("No se pudo sincronizar recursos al abrir", err);
            });
          }
        } else {
          setEstado("no-encontrado");
        }
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("No se pudo cargar la ficha", err);
        setEstado("error");
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  function flushPendingSave() {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return Promise.resolve();
    const run = saveQueueRef.current.then(() => guardarPersonaje(pending));
    saveQueueRef.current = run.catch(() => {});
    return run;
  }

  useEffect(() => {
    return () => {
      void flushPendingSave();
    };
  }, [id]);

  useEffect(() => {
    function onLeave() {
      void flushPendingSave();
    }
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  async function commitSave(next: Character) {
    setSaveStatus("saving");
    if (saveFadeRef.current) clearTimeout(saveFadeRef.current);
    const run = saveQueueRef.current.then(() => guardarPersonaje(next));
    saveQueueRef.current = run.catch(() => {});
    try {
      await run;
      setErrorGuardado(null);
      setSaveStatus("saved");
      saveFadeRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_FADE_MS);
    } catch (err) {
      console.error("No se pudo guardar la ficha", err);
      setSaveStatus("error");
      setErrorGuardado(
        err instanceof Error ? err.message : "No se pudieron guardar los cambios.",
      );
      const currentId = idRef.current;
      if (currentId) {
        const fresh = await obtenerPersonaje(currentId);
        if (fresh) setCharacter(fresh);
      }
    }
  }

  function persist(next: Character) {
    setCharacter(next);
    pendingSaveRef.current = next;
    setSaveStatus("saving");
    if (saveFadeRef.current) clearTimeout(saveFadeRef.current);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const toSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (toSave) void commitSave(toSave);
    }, DEBOUNCE_MS);
  }

  return { character, estado, errorGuardado, saveStatus, persist };
}
