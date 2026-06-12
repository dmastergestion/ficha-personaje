import { describe, expect, it } from "vitest";
import { limpiarTextoConjuro } from "@/lib/spell-text-clean";
import {
  descripcionConjuro,
  metaConjuroParaMostrar,
  traducirComponentesConjuro,
} from "@/rules/spell-text";

describe("limpiarTextoConjuro", () => {
  it("elimina marcadores Foundry y traduce condiciones", () => {
    const text = limpiarTextoConjuro(
      "Efecto con &amp;Reference[frightened apply=false] y @UUID[Compendium.x]{Desplazamiento entre planos}.",
    );
    expect(text).toContain("asustado");
    expect(text).toContain("Desplazamiento entre planos");
    expect(text).not.toMatch(/Reference|@UUID/);
  });

  it("elimina notas de Foundry al final", () => {
    const text = limpiarTextoConjuro("Descripción.\nNota de Foundry\nTexto técnico.");
    expect(text).toBe("Descripción.");
  });
});

describe("traducirComponentesConjuro", () => {
  it("traduce material de alarma al español", () => {
    expect(traducirComponentesConjuro("V, S, M (a bell and silver wire)")).toBe(
      "V, S, M (una campana y hilo de plata)",
    );
  });
});

describe("descripcionConjuro", () => {
  it("devuelve descripción en español para Alarma", () => {
    const text = descripcionConjuro("alarm");
    expect(text).toBeDefined();
    expect(text).toMatch(/alarma/i);
    expect(text).not.toMatch(/You set an alarm/);
  });

  it("traduce DimLight en Voluta estelar", () => {
    const text = descripcionConjuro("starry-wisp");
    expect(text).toBeDefined();
    expect(text).toContain("luz tenue");
    expect(text).not.toMatch(/DimLight/i);
  });
});

describe("metaConjuroParaMostrar", () => {
  it("sustituye la descripción inglesa por la española", () => {
    const meta = metaConjuroParaMostrar("alarm", {
      tipo: "none",
      description: "You set an alarm against intrusion.",
    });
    expect(meta.description).toMatch(/alarma/i);
    expect(meta.description).not.toMatch(/You set an alarm/);
  });

  it("traduce componentes materiales", () => {
    const meta = metaConjuroParaMostrar("alarm", {
      tipo: "none",
      components: "V, S, M (a bell and silver wire)",
    });
    expect(meta.components).toContain("campana");
  });
});
