import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ABILITY_KEYS } from "@/lib/constants";
import type { AbilityKey } from "@/lib/constants";
import { guardarPersonaje } from "@/db/repository";
import { modificadorAtributo } from "@/rules/ability";
import {
  ARRAY_ESTANDAR,
  abilitiesPointBuyInicial,
  asignarArrayEstandarManual,
  asignarTiradas4d6,
  crearPersonajeDesdeAsistente,
  indicesLibresAsignacion,
  type DatosAsistente,
} from "@/rules/creation";
import {
  clampIndicePaso,
  mejorasCreacionVacias,
  validarPasoAsistente,
} from "@/rules/creation-wizard";
import {
  eleccionClaseCompleta,
  eleccionesClase,
  fusionarEleccionesClase,
  resumenEquipoClase,
} from "@/rules/class-equipment";
import { cantidadMejorasAtributosHastaNivel } from "@/rules/class-features";
import { periciasClaseCompletas, periciasClaseDesdeElecciones } from "@/rules/class-skills";
import { tirarSeisAtributos4d6, type Tirada4d6 } from "@/rules/dice";
import {
  aplicarBonificadoresAtributo,
  calcularBeneficiosOrigen,
  origenCatalogoDesdeIds,
} from "@/rules/origin-benefits";
import { fusionarEleccionesOrigen } from "@/rules/origin-choices";
import { proficienciasIniciales } from "@/rules/proficiencies";
import {
  clasesParaEleccionConjuros,
  necesitaPasoConjuros,
  validarSeleccionConjuros,
  type SeleccionConjuros,
} from "@/rules/spell-choices";
import { idsConjurosAsignados } from "@/rules/spell-grants";
import { claseTieneMaestriaArmas, maestriasArmasCompletas } from "@/rules/weapon-mastery";
import { crearPersonajeVacio } from "@/schemas/character";
import { useCatalogStore } from "@/stores/catalog-store";
import {
  ABILITIES_DEFAULT,
  DRAFT_KEY,
  leerBorrador,
  pasosAsistente,
  SELECCION_CONJUROS_VACIA,
} from "@/pages/character-new/draft";
import type { ModoAtributos, PasoAsistenteId } from "@/pages/character-new/types";

export function useAsistenteCreacion() {
  const navigate = useNavigate();
  const catalog = useCatalogStore((s) => s.catalog);
  const borrador = useMemo(() => leerBorrador(), []);
  const [paso, setPaso] = useState(borrador?.paso ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [tiradas4d6, setTiradas4d6] = useState<Tirada4d6[] | null>(borrador?.tiradas4d6 ?? null);
  const [asignacion4d6, setAsignacion4d6] = useState<Partial<Record<AbilityKey, number>>>(
    borrador?.asignacion4d6 ?? {},
  );
  const [asignacionArray, setAsignacionArray] = useState<Partial<Record<AbilityKey, number>>>(
    borrador?.asignacionArray ?? {},
  );
  const [modoAtributos, setModoAtributos] = useState<ModoAtributos>(
    borrador?.modoAtributos ?? "manual",
  );
  const [spellSelection, setSpellSelection] = useState<SeleccionConjuros>(
    borrador?.spellSelection ?? SELECCION_CONJUROS_VACIA,
  );
  const [datos, setDatos] = useState<DatosAsistente>(() => ({
    name: "",
    playerName: "",
    speciesId: catalog.species[0]?.id ?? null,
    backgroundId: null,
    classId: catalog.classes[0]?.id ?? "fighter",
    subclassId: null,
    level: 1,
    abilities: { ...ABILITIES_DEFAULT },
    weaponMasteries: [],
    ...borrador?.datos,
  }));

  const pasos = useMemo(
    () => pasosAsistente(datos.classId, datos.level),
    [datos.classId, datos.level],
  );
  const pasoActual = pasos[clampIndicePaso(paso, pasos.length)]?.id ?? "identidad";

  const clasesConjuro = useMemo(
    () => clasesParaEleccionConjuros(datos.classId, datos.subclassId, datos.level),
    [datos.classId, datos.subclassId, datos.level],
  );

  const subclasesFiltradas = useMemo(
    () => catalog.subclasses.filter((sc) => sc.classId === datos.classId),
    [catalog.subclasses, datos.classId],
  );

  const catalogoOrigen = useMemo(
    () =>
      origenCatalogoDesdeIds(
        datos.speciesId,
        datos.backgroundId,
        catalog.obtenerEspecie.bind(catalog),
        catalog.obtenerTrasfondo.bind(catalog),
      ),
    [catalog, datos.speciesId, datos.backgroundId],
  );

  const classOpts = useMemo(
    () => ({
      classLevel: datos.level,
      classes: clasesConjuro,
      trucosConocidos: spellSelection.cantripsKnown,
    }),
    [datos.level, clasesConjuro, spellSelection.cantripsKnown],
  );
  const originChoices = useMemo(
    () =>
      fusionarEleccionesClase(
        datos.classId,
        fusionarEleccionesOrigen(
          datos.speciesId,
          datos.backgroundId,
          datos.originChoices,
          catalogoOrigen,
        ),
        classOpts,
      ),
    [datos.speciesId, datos.backgroundId, datos.classId, datos.originChoices, catalogoOrigen, classOpts],
  );

  const idsExcluidosConjuros = useMemo(() => {
    const pj = crearPersonajeVacio({
      name: "borrador",
      playerName: "",
      classId: datos.classId,
      speciesId: datos.speciesId,
      level: datos.level,
    });
    return [
      ...idsConjurosAsignados({
        ...pj,
        identity: {
          ...pj.identity,
          subclassId: datos.subclassId,
          backgroundId: datos.backgroundId,
          classes: clasesConjuro.length > 0 ? clasesConjuro : pj.identity.classes,
        },
        originChoices,
      }),
    ];
  }, [
    datos.classId,
    datos.speciesId,
    datos.level,
    datos.subclassId,
    datos.backgroundId,
    clasesConjuro,
    originChoices,
  ]);

  const defsEquipoClase = useMemo(
    () => eleccionesClase(datos.classId, classOpts),
    [datos.classId, classOpts],
  );
  const eleccionEquipoClase = defsEquipoClase.find((d) => d.id === "equipment");
  const resumenEquipoClaseActual = useMemo(() => {
    const choice = originChoices.class.equipment as "A" | "B" | "C" | undefined;
    if (!choice || !datos.classId) return [];
    return resumenEquipoClase(datos.classId, choice, originChoices);
  }, [datos.classId, originChoices]);

  const beneficiosOrigen = useMemo(
    () =>
      calcularBeneficiosOrigen(
        datos.speciesId,
        datos.backgroundId,
        datos.level,
        catalogoOrigen,
        originChoices,
      ),
    [datos.speciesId, datos.backgroundId, datos.level, catalogoOrigen, originChoices],
  );

  const atributosFinales = useMemo(
    () => aplicarBonificadoresAtributo(datos.abilities, beneficiosOrigen.abilityBonuses),
    [datos.abilities, beneficiosOrigen.abilityBonuses],
  );

  const borradorMaestrias = useMemo(() => {
    const profs = proficienciasIniciales(
      datos.classId,
      beneficiosOrigen.skills,
      beneficiosOrigen.toolProficiencies,
      periciasClaseDesdeElecciones(datos.classId, originChoices.class),
    );
    const draft = crearPersonajeVacio({
      name: datos.name || "Borrador",
      playerName: datos.playerName,
      classId: datos.classId,
      level: datos.level,
    });
    return {
      ...draft,
      identity: {
        ...draft.identity,
        classes: [{ classId: datos.classId, subclassId: datos.subclassId, level: datos.level }],
      },
      proficiencies: {
        ...draft.proficiencies,
        savingThrows: profs.savingThrows,
        skills: profs.skills,
        armorProficiencies: profs.armorProficiencies,
        weaponProficiencies: profs.weaponProficiencies,
        toolProficiencies: profs.toolProficiencies,
      },
      weaponMasteries: datos.weaponMasteries ?? [],
    };
  }, [datos, beneficiosOrigen, originChoices.class]);

  useEffect(() => {
    setPaso((p) => clampIndicePaso(p, pasos.length));
  }, [pasos.length]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          datos,
          paso,
          modoAtributos,
          asignacion4d6,
          asignacionArray,
          spellSelection,
          tiradas4d6,
        }),
      );
    } catch {
      /* quota / private mode */
    }
  }, [datos, paso, modoAtributos, asignacion4d6, asignacionArray, spellSelection, tiradas4d6]);

  function textoAtributo(key: AbilityKey): string {
    const base = datos.abilities[key];
    const bonus = beneficiosOrigen.abilityBonuses[key] ?? 0;
    const final = atributosFinales[key];
    const mod = modificadorAtributo(final);
    const modStr = mod >= 0 ? `+${mod}` : String(mod);
    if (bonus > 0) {
      return `Base ${base} +${bonus} origen → ${final} · Mod ${modStr}`;
    }
    return `Valor ${base} · Mod ${modStr}`;
  }

  function actualizar(partial: Partial<DatosAsistente>) {
    setDatos((prev) => {
      const next = { ...prev, ...partial };
      if (partial.classId !== undefined || partial.level !== undefined) {
        setSpellSelection(SELECCION_CONJUROS_VACIA);
        if (partial.classId !== undefined && partial.classId !== prev.classId) {
          next.weaponMasteries = [];
          next.subclassId = null;
          next.fightingStyleFeatId = null;
          next.originChoices = {
            species: next.originChoices?.species ?? {},
            background: next.originChoices?.background ?? {},
            class: {},
          };
        }
        next.mejorasNivel = mejorasCreacionVacias(
          cantidadMejorasAtributosHastaNivel(next.classId, next.level),
          next.mejorasNivel,
        );
      }
      return next;
    });
  }

  function tirarAtributos4d6() {
    const tiradas = tirarSeisAtributos4d6();
    setModoAtributos("4d6");
    setTiradas4d6(tiradas);
    setAsignacion4d6({});
    setAsignacionArray({});
  }

  function asignarTiradaAtributo(key: AbilityKey, index: number | null) {
    const next = { ...asignacion4d6 };
    if (index === null) {
      delete next[key];
    } else {
      const total = tiradas4d6?.length ?? 0;
      if (!indicesLibresAsignacion(asignacion4d6, key, total).includes(index)) return;
      next[key] = index;
    }
    setAsignacion4d6(next);
    const abilities = asignarTiradas4d6(tiradas4d6 ?? [], next);
    if (abilities) actualizar({ abilities });
  }

  function usarArrayEstandar() {
    setModoAtributos("array");
    setTiradas4d6(null);
    setAsignacion4d6({});
    setAsignacionArray({});
    actualizar({
      abilities: Object.fromEntries(ABILITY_KEYS.map((k) => [k, 10])) as Record<AbilityKey, number>,
    });
  }

  function usarPointBuy() {
    setModoAtributos("pointBuy");
    setTiradas4d6(null);
    setAsignacion4d6({});
    setAsignacionArray({});
    actualizar({ abilities: abilitiesPointBuyInicial() });
  }

  function asignarValorArray(key: AbilityKey, index: number | null) {
    const next = { ...asignacionArray };
    if (index === null) {
      delete next[key];
    } else {
      if (!indicesLibresAsignacion(asignacionArray, key, ARRAY_ESTANDAR.length).includes(index)) {
        return;
      }
      next[key] = index;
    }
    setAsignacionArray(next);
    const abilities = asignarArrayEstandarManual(next);
    if (abilities) actualizar({ abilities });
  }

  function validarPaso(stepId: PasoAsistenteId): string | null {
    const conjurosMsg =
      stepId === "conjuros" ||
      (stepId === "resumen" && necesitaPasoConjuros(datos.classId, datos.level))
        ? validarSeleccionConjuros(clasesConjuro, spellSelection, originChoices)
        : null;
    return validarPasoAsistente(stepId, datos, {
      originChoices,
      catalogoOrigen,
      modoAtributos,
      tiradas4d6,
      asignacion4d6,
      asignacionArray,
      periciasClaseOk: periciasClaseCompletas(datos.classId, originChoices.class),
      eleccionClaseOk: eleccionClaseCompleta(datos.classId, originChoices, classOpts),
      maestriasOk:
        !claseTieneMaestriaArmas(datos.classId) || maestriasArmasCompletas(borradorMaestrias),
      conjurosMsg,
    });
  }

  function validarPasoActual(): string | null {
    return validarPaso(pasoActual);
  }

  function irAPaso(index: number) {
    if (index === paso || index < 0 || index >= pasos.length) return;
    if (index < paso) {
      setError(null);
      setPaso(index);
      return;
    }
    for (let i = paso; i < index; i++) {
      const msg = validarPaso(pasos[i]!.id);
      if (msg) {
        setError(msg);
        setPaso(i);
        return;
      }
    }
    setError(null);
    setPaso(index);
  }

  function siguiente() {
    const msg = validarPasoActual();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(pasos.length - 1, p + 1));
  }

  function anterior() {
    setError(null);
    setPaso((p) => Math.max(0, p - 1));
  }

  async function crear() {
    const msg = validarPasoActual();
    if (msg) {
      setError(msg);
      return;
    }
    setCreando(true);
    setError(null);
    try {
      const character = crearPersonajeDesdeAsistente(
        { ...datos, originChoices, spellSelection },
        catalogoOrigen,
      );
      await guardarPersonaje(character);
      sessionStorage.removeItem(DRAFT_KEY);
      navigate(`/character/${character.id}`);
    } catch (err) {
      console.error("No se pudo crear la ficha", err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el personaje en este dispositivo.",
      );
    } finally {
      setCreando(false);
    }
  }

  return {
    catalog,
    datos,
    actualizar,
    paso,
    pasos,
    pasoActual,
    error,
    creando,
    origen: {
      catalogoOrigen,
      originChoices,
      beneficiosOrigen,
      atributosFinales,
    },
    clase: {
      clasesConjuro,
      subclasesFiltradas,
      eleccionEquipoClase,
      resumenEquipoClaseActual,
      borradorMaestrias,
    },
    atributos: {
      modoAtributos,
      setModoAtributos,
      tiradas4d6,
      asignacion4d6,
      asignacionArray,
      textoAtributo,
      tirarAtributos4d6,
      asignarTiradaAtributo,
      usarArrayEstandar,
      usarPointBuy,
      asignarValorArray,
    },
    conjuros: {
      spellSelection,
      setSpellSelection,
      idsExcluidosConjuros,
    },
    irAPaso,
    siguiente,
    anterior,
    crear,
  };
}
