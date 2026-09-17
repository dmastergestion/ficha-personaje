import { describe, expect, it } from "vitest";
import {
  convertirFormaEnEspacio,
  dadoArtesMarciales,
  espaciosRecuperadosAstuciaMagica,
  fijarRabia,
  presupuestoRecuperacionArcana,
  recuperarFormaConEspacio,
  recursoOcultoEnPanelUsos,
  usarAguanteImplicable,
  usarAstuciaMagica,
  usarCuracionRapida,
  usarImposicionManos,
  usarIncansable,
  usarLuzCurativa,
  usarManosSanadoras,
  usarMetabolismoAsombroso,
  usarPlenitudCuerpo,
  usarRabiaPersistente,
  usarRecuperacionArcana,
  usarRecursoFicha,
  usarSegundoAliento,
  usarSubidonAdrenalina,
} from "@/rules/resource-use";
import {
  ARCANE_RECOVERY_RESOURCE_ID,
  FOCUS_POINTS_RESOURCE_ID,
  HEALING_LIGHT_RESOURCE_ID,
  LAY_ON_HANDS_RESOURCE_ID,
  MAGICAL_CUNNING_RESOURCE_ID,
  PERSISTENT_RAGE_RESOURCE_ID,
  RAGE_RESOURCE_ID,
  SECOND_WIND_RESOURCE_ID,
  TIRELESS_RESOURCE_ID,
  UNCANNY_METABOLISM_RESOURCE_ID,
  WHOLENESS_RESOURCE_ID,
  WILD_RESURGENCE_SLOT_ID,
} from "@/rules/resource-ids";
import { aplicarDeltaPvPersonaje } from "@/rules/combat-hp";
import { WILD_SHAPE_RESOURCE_ID } from "@/rules/wild-shape";
import { poblarRecursosSugeridos } from "@/rules/resources-tracker";
import { crearPersonajeVacio } from "@/schemas/character";

describe("recursoOcultoEnPanelUsos", () => {
  it("oculta rabia, forma salvaje y recuperaciones de espacios", () => {
    expect(recursoOcultoEnPanelUsos(RAGE_RESOURCE_ID)).toBe(true);
    expect(recursoOcultoEnPanelUsos(WILD_SHAPE_RESOURCE_ID)).toBe(true);
    expect(recursoOcultoEnPanelUsos(MAGICAL_CUNNING_RESOURCE_ID)).toBe(true);
    expect(recursoOcultoEnPanelUsos(ARCANE_RECOVERY_RESOURCE_ID)).toBe(true);
    expect(recursoOcultoEnPanelUsos(SECOND_WIND_RESOURCE_ID)).toBe(false);
  });
});

describe("dadoArtesMarciales", () => {
  it("sigue la tabla PHB 2024", () => {
    expect(dadoArtesMarciales(1)).toBe("d6");
    expect(dadoArtesMarciales(5)).toBe("d8");
    expect(dadoArtesMarciales(11)).toBe("d10");
    expect(dadoArtesMarciales(17)).toBe("d12");
  });
});

describe("usarManosSanadoras", () => {
  it("gasta un uso y cura PBd4", () => {
    const base = crearPersonajeVacio({
      name: "A",
      playerName: "J",
      classId: "cleric",
      speciesId: "aasimar",
      level: 1,
    });
    base.combat.hpMax = 20;
    base.combat.hpCurrent = 4;
    const pj = poblarRecursosSugeridos(base);
    const id = pj.resources.find((r) => r.id.endsWith(":healing-hands"))!.id;
    const next = usarManosSanadoras(pj, id, [4, 3]);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(11);
    expect(next.character.resources.find((r) => r.id === id)?.used).toBe(1);
  });
});

describe("usarPlenitudCuerpo", () => {
  it("cura dado marcial + SAB", () => {
    const base = crearPersonajeVacio({ name: "M", playerName: "J", classId: "monk", level: 6 });
    base.identity.classes = [{ classId: "monk", subclassId: "open-hand", level: 6 }];
    base.identity.subclassId = "open-hand";
    base.abilities.wis = 16;
    base.combat.hpMax = 40;
    base.combat.hpCurrent = 10;
    const pj = poblarRecursosSugeridos(base);
    const next = usarPlenitudCuerpo(pj, WHOLENESS_RESOURCE_ID, 5);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(18);
  });
});

describe("usarIncansable", () => {
  it("otorga PG temporales 1d8 + SAB", () => {
    const base = crearPersonajeVacio({ name: "R", playerName: "J", classId: "ranger", level: 10 });
    base.identity.classes = [{ classId: "ranger", subclassId: null, level: 10 }];
    base.abilities.wis = 14;
    const pj = poblarRecursosSugeridos(base);
    const next = usarIncansable(pj, TIRELESS_RESOURCE_ID, 7);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpTemp).toBe(9);
  });
});

describe("usarMetabolismoAsombroso", () => {
  it("recupera el enfoque y cura nivel + dado marcial", () => {
    const base = crearPersonajeVacio({ name: "M", playerName: "J", classId: "monk", level: 5 });
    base.identity.classes = [{ classId: "monk", subclassId: null, level: 5 }];
    base.combat.hpMax = 40;
    base.combat.hpCurrent = 10;
    const pj = poblarRecursosSugeridos(base);
    pj.resources = pj.resources.map((r) =>
      r.id === FOCUS_POINTS_RESOURCE_ID ? { ...r, used: r.max } : r,
    );
    const next = usarMetabolismoAsombroso(pj, 6);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.resources.find((r) => r.id === FOCUS_POINTS_RESOURCE_ID)?.used).toBe(0);
    expect(next.character.combat.hpCurrent).toBe(21);
    expect(next.character.resources.find((r) => r.id === UNCANNY_METABOLISM_RESOURCE_ID)?.used).toBe(
      1,
    );
  });
});

describe("usarRabiaPersistente", () => {
  it("restaura los usos de Rabia", () => {
    const base = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian", level: 15 });
    base.identity.classes = [{ classId: "barbarian", subclassId: null, level: 15 }];
    const pj = poblarRecursosSugeridos(base);
    pj.resources = pj.resources.map((r) =>
      r.id === RAGE_RESOURCE_ID ? { ...r, used: r.max } : r,
    );
    const next = usarRabiaPersistente(pj);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.resources.find((r) => r.id === RAGE_RESOURCE_ID)?.used).toBe(0);
    expect(next.character.resources.find((r) => r.id === PERSISTENT_RAGE_RESOURCE_ID)?.used).toBe(1);
  });
});

describe("usarRecuperacionArcana", () => {
  it("presupuesto = mitad de nivel redondeando arriba", () => {
    expect(presupuestoRecuperacionArcana(1)).toBe(1);
    expect(presupuestoRecuperacionArcana(5)).toBe(3);
    expect(presupuestoRecuperacionArcana(6)).toBe(3);
  });

  it("recupera primero los espacios de menor nivel (1.º–5.º)", () => {
    const base = crearPersonajeVacio({ name: "W", playerName: "J", classId: "wizard", level: 5 });
    base.identity.classes = [{ classId: "wizard", subclassId: null, level: 5 }];
    base.spells.spellSlotsUsed["1"] = 2;
    base.spells.spellSlotsUsed["2"] = 1;
    const pj = poblarRecursosSugeridos(base);
    const next = usarRecuperacionArcana(pj);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.spells.spellSlotsUsed["1"]).toBe(0);
    expect(next.character.spells.spellSlotsUsed["2"]).toBe(1);
    expect(next.character.resources.find((r) => r.id === ARCANE_RECOVERY_RESOURCE_ID)?.used).toBe(1);
  });

  it("no recupera espacios de 6.º+", () => {
    const base = crearPersonajeVacio({ name: "W", playerName: "J", classId: "wizard", level: 13 });
    base.identity.classes = [{ classId: "wizard", subclassId: null, level: 13 }];
    base.spells.spellSlotsUsed["6"] = 1;
    const pj = poblarRecursosSugeridos(base);
    expect(usarRecuperacionArcana(pj).ok).toBe(false);
  });
});

describe("resurgimiento salvaje", () => {
  function druida5() {
    const base = crearPersonajeVacio({ name: "D", playerName: "J", classId: "druid", level: 5 });
    base.identity.classes = [{ classId: "druid", subclassId: null, level: 5 }];
    const pj = poblarRecursosSugeridos(base);
    pj.resources = pj.resources.map((r) =>
      r.id === WILD_SHAPE_RESOURCE_ID ? { ...r, used: 1 } : r,
    );
    pj.spells.spellSlotsUsed["1"] = 2;
    return pj;
  }

  it("convierte un uso de forma en espacio de nivel 1", () => {
    const next = convertirFormaEnEspacio(druida5());
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.resources.find((r) => r.id === WILD_SHAPE_RESOURCE_ID)?.used).toBe(2);
    expect(next.character.spells.spellSlotsUsed["1"]).toBe(1);
    expect(next.character.resources.find((r) => r.id === WILD_RESURGENCE_SLOT_ID)?.used).toBe(1);
  });

  it("gasta un espacio para recuperar un uso de forma", () => {
    const next = recuperarFormaConEspacio(druida5());
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.resources.find((r) => r.id === WILD_SHAPE_RESOURCE_ID)?.used).toBe(0);
    expect(next.character.spells.spellSlotsUsed["1"]).toBe(3);
  });
});

describe("usarLuzCurativa", () => {
  it("gasta dados del grupo y cura esa tirada", () => {
    const base = crearPersonajeVacio({ name: "W", playerName: "J", classId: "warlock", level: 3 });
    base.identity.classes = [{ classId: "warlock", subclassId: "celestial", level: 3 }];
    base.identity.subclassId = "celestial";
    base.combat.hpMax = 30;
    base.combat.hpCurrent = 5;
    const pj = poblarRecursosSugeridos(base);
    const next = usarLuzCurativa(pj, HEALING_LIGHT_RESOURCE_ID, 2, [6, 4]);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(15);
    expect(next.character.resources.find((r) => r.id === HEALING_LIGHT_RESOURCE_ID)?.used).toBe(2);
  });
});

describe("usarRecursoFicha", () => {
  it("aplica adrenalina y aguante desde el id de especie", () => {
    const base = crearPersonajeVacio({
      name: "O",
      playerName: "J",
      classId: "fighter",
      speciesId: "orc",
      level: 5,
    });
    base.combat.hpCurrent = 0;
    const pj = poblarRecursosSugeridos(base);
    const adr = pj.resources.find((r) => r.id.endsWith(":adrenaline-rush"))!.id;
    const temp = usarSubidonAdrenalina(pj, adr);
    expect(temp.ok).toBe(true);
    if (temp.ok) expect(temp.character.combat.hpTemp).toBe(3);

    const aguanteId = pj.resources.find((r) => r.id.endsWith(":relentless-endurance"))!.id;
    const aguante = usarAguanteImplicable(pj, aguanteId);
    expect(aguante.ok).toBe(true);
    if (aguante.ok) expect(aguante.character.combat.hpCurrent).toBe(1);
  });

  it("Curación rápida suma 1d6+4+dados de golpe", () => {
    const base = crearPersonajeVacio({ name: "S", playerName: "J", classId: "fighter", level: 4 });
    base.feats = [{ id: "healer", name: "Sanador" }];
    base.combat.hitDiceTotal = 4;
    base.combat.hpMax = 40;
    base.combat.hpCurrent = 10;
    const pj = poblarRecursosSugeridos(base);
    const id = pj.resources.find((r) => r.id.endsWith(":fast-healing"))!.id;
    const next = usarCuracionRapida(pj, id, 3);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(21);
  });

  it("despacha Segundo aliento por id (el panel Usar genérico)", () => {
    const base = crearPersonajeVacio({ name: "G", playerName: "J", classId: "fighter", level: 1 });
    base.combat.hpMax = 20;
    base.combat.hpCurrent = 5;
    const pj = poblarRecursosSugeridos(base);
    const next = usarRecursoFicha(pj, SECOND_WIND_RESOURCE_ID, { dados: [10] });
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBeGreaterThan(5);
    expect(next.character.resources.find((r) => r.id === SECOND_WIND_RESOURCE_ID)?.used).toBe(1);
  });
});

describe("usarSegundoAliento", () => {
  it("gasta un uso y cura 1d10 + nivel de guerrero", () => {
    const base = crearPersonajeVacio({ name: "G", playerName: "J", classId: "fighter", level: 3 });
    base.identity.classes = [{ classId: "fighter", subclassId: null, level: 3 }];
    base.combat.hpMax = 28;
    base.combat.hpCurrent = 10;
    const pj = poblarRecursosSugeridos(base);
    const next = usarSegundoAliento(pj, 10);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(23);
    expect(next.character.resources.find((r) => r.id === SECOND_WIND_RESOURCE_ID)?.used).toBe(1);
  });

  it("falla sin usos", () => {
    const base = crearPersonajeVacio({ name: "G", playerName: "J", classId: "fighter", level: 1 });
    const pj = poblarRecursosSugeridos(base);
    pj.resources = pj.resources.map((r) =>
      r.id === SECOND_WIND_RESOURCE_ID ? { ...r, used: r.max } : r,
    );
    expect(usarSegundoAliento(pj, 5)).toEqual({
      ok: false,
      error: "No te quedan usos de Segundo aliento.",
    });
  });
});

describe("usarImposicionManos", () => {
  it("gasta puntos y cura esa cantidad", () => {
    const base = crearPersonajeVacio({ name: "P", playerName: "J", classId: "paladin", level: 2 });
    base.identity.classes = [{ classId: "paladin", subclassId: null, level: 2 }];
    base.combat.hpMax = 20;
    base.combat.hpCurrent = 8;
    const pj = poblarRecursosSugeridos(base);
    const next = usarImposicionManos(pj, 5);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.hpCurrent).toBe(13);
    expect(next.character.resources.find((r) => r.id === LAY_ON_HANDS_RESOURCE_ID)?.used).toBe(5);
  });
});

describe("fijarRabia", () => {
  it("al activar gasta un uso", () => {
    const base = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian", level: 1 });
    const pj = poblarRecursosSugeridos(base);
    const next = fijarRabia(pj, true);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.combat.raging).toBe(true);
    expect(next.character.resources.find((r) => r.id === RAGE_RESOURCE_ID)?.used).toBe(1);
  });

  it("terminar no devuelve el uso", () => {
    const base = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian", level: 1 });
    const pj = poblarRecursosSugeridos(base);
    const activa = fijarRabia(pj, true);
    if (!activa.ok) return;
    const off = fijarRabia(activa.character, false);
    expect(off.ok).toBe(true);
    if (!off.ok) return;
    expect(off.character.combat.raging).toBe(false);
    expect(off.character.resources.find((r) => r.id === RAGE_RESOURCE_ID)?.used).toBe(1);
  });
});

describe("Corazón Salvaje y Árbol del Mundo", () => {
  it("Oso resiste fuego pero no fuerza", () => {
    const base = crearPersonajeVacio({ name: "B", playerName: "J", classId: "barbarian", level: 3 });
    base.identity.classes = [{ classId: "barbarian", subclassId: "wild-heart", level: 3 }];
    base.identity.subclassId = "wild-heart";
    base.combat.hpCurrent = 20;
    base.combat.hpMax = 28;
    const pj = poblarRecursosSugeridos(base);
    const activa = fijarRabia(pj, true, { wildHeart: "bear" });
    expect(activa.ok).toBe(true);
    if (!activa.ok) return;
    expect(activa.character.originChoices.class["wild-heart-rage"]).toBe("bear");
    const fuego = aplicarDeltaPvPersonaje(activa.character, -10, { damageType: "fuego" });
    expect(fuego.character.combat.hpCurrent).toBe(15);
    const fuerza = aplicarDeltaPvPersonaje(activa.character, -10, { damageType: "fuerza" });
    expect(fuerza.character.combat.hpCurrent).toBe(10);
  });

  it("Árbol del Mundo da PG temporales iguales al nivel de bárbaro", () => {
    const base = crearPersonajeVacio({ name: "A", playerName: "J", classId: "barbarian", level: 5 });
    base.identity.classes = [{ classId: "barbarian", subclassId: "world-tree", level: 5 }];
    base.identity.subclassId = "world-tree";
    const pj = poblarRecursosSugeridos(base);
    const activa = fijarRabia(pj, true);
    expect(activa.ok).toBe(true);
    if (!activa.ok) return;
    expect(activa.character.combat.hpTemp).toBe(5);
  });
});

describe("usarAstuciaMagica", () => {
  it("recupera hasta la mitad de los espacios de pacto (redondeando arriba)", () => {
    expect(espaciosRecuperadosAstuciaMagica(1)).toBe(1);
    expect(espaciosRecuperadosAstuciaMagica(2)).toBe(1);
    expect(espaciosRecuperadosAstuciaMagica(3)).toBe(2);
    expect(espaciosRecuperadosAstuciaMagica(4)).toBe(2);

    const base = crearPersonajeVacio({ name: "W", playerName: "J", classId: "warlock", level: 5 });
    base.identity.classes = [{ classId: "warlock", subclassId: null, level: 5 }];
    base.spells.pactMagicUsed = 2;
    const pj = poblarRecursosSugeridos(base);
    const next = usarAstuciaMagica(pj);
    expect(next.ok).toBe(true);
    if (!next.ok) return;
    expect(next.character.spells.pactMagicUsed).toBe(1);
    expect(next.character.resources.find((r) => r.id === MAGICAL_CUNNING_RESOURCE_ID)?.used).toBe(1);
  });

  it("no hace nada si no hay espacios gastados", () => {
    const base = crearPersonajeVacio({ name: "W", playerName: "J", classId: "warlock", level: 5 });
    base.identity.classes = [{ classId: "warlock", subclassId: null, level: 5 }];
    base.spells.pactMagicUsed = 0;
    const pj = poblarRecursosSugeridos(base);
    expect(usarAstuciaMagica(pj)).toEqual({
      ok: false,
      error: "No tienes espacios de pacto gastados que recuperar.",
    });
  });
});
