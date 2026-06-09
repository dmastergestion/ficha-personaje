import { describe, expect, it } from "vitest";
import {
  estadisticasMetaConjuros,
  metaTiradaConjuro,
  tirarDañoConjuro,
} from "@/rules/spell-cast-meta";

describe("metaTiradaConjuro", () => {
  it("cubre los 340 conjuros SRD", () => {
    const stats = estadisticasMetaConjuros();
    expect(stats.total).toBe(340);
    expect(stats.ataques).toBeGreaterThan(15);
    expect(stats.salvaciones).toBeGreaterThan(100);
    expect(stats.conDaño).toBeGreaterThan(90);
  });

  it("clasifica conjuros de ataque", () => {
    expect(metaTiradaConjuro("fire-bolt").tipo).toBe("attack");
    expect(metaTiradaConjuro("fire-bolt").damage?.dice).toBe("1d10");
  });

  it("clasifica conjuros de salvación con su atributo", () => {
    const meta = metaTiradaConjuro("fireball");
    expect(meta.tipo).toBe("save");
    expect(meta.save).toBe("dex");
    expect(meta.damage?.dice).toBe("8d6");
  });

  it("usa el dato del catálogo si está disponible", () => {
    const meta = metaTiradaConjuro("desconocido", {
      id: "desconocido",
      srdId: "x",
      nameEn: "X",
      level: 1,
      school: "evo",
      castType: "save",
      save: "wis",
      damage: { dice: "3d8", type: "frío" },
    });
    expect(meta.tipo).toBe("save");
    expect(meta.save).toBe("wis");
    expect(meta.damage?.dice).toBe("3d8");
  });

  it("no asigna daño a conjuros de utilidad sin daño real", () => {
    expect(metaTiradaConjuro("bless").damage).toBeUndefined();
    expect(metaTiradaConjuro("bane").damage).toBeUndefined();
  });
});

describe("tirarDañoConjuro", () => {
  it("escala dados por nivel de espacio por encima del base", () => {
    const meta = metaTiradaConjuro("fireball");
    const daño = tirarDañoConjuro(meta.damage!, 3, 5, 9);
    expect(daño?.formula).toBe("10d6");
    expect(daño!.rolls).toHaveLength(10);
  });

  it("no escala si se lanza al nivel base", () => {
    const meta = metaTiradaConjuro("fireball");
    const daño = tirarDañoConjuro(meta.damage!, 3, 3, 5);
    expect(daño?.formula).toBe("8d6");
  });

  it("los trucos escalan con el nivel de personaje", () => {
    const meta = metaTiradaConjuro("fire-bolt");
    expect(tirarDañoConjuro(meta.damage!, 0, 0, 1)?.formula).toBe("1d10");
    expect(tirarDañoConjuro(meta.damage!, 0, 0, 5)?.formula).toBe("2d10");
    expect(tirarDañoConjuro(meta.damage!, 0, 0, 11)?.formula).toBe("3d10");
    expect(tirarDañoConjuro(meta.damage!, 0, 0, 17)?.formula).toBe("4d10");
  });
});
