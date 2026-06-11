import { describe, expect, it } from "vitest";
import { limpiarTextoOrigen } from "@/lib/origin-text";

describe("limpiarTextoOrigen", () => {
  it("elimina marcadores 5etools", () => {
    const text = limpiarTextoOrigen(
      "Healing Hands: As a {@action Magic|XPHB} action, roll {@dice 1d4|XPHB}.",
    );
    expect(text).not.toContain("{@");
    expect(text).not.toContain("XPHB");
  });
});
