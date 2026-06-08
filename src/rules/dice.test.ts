import { describe, expect, it, vi, afterEach } from "vitest";
import { tirarD20 } from "@/rules/dice";

describe("tirarD20", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("suma el modificador en modo normal", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // floor(0.5*20)+1 = 11
    const roll = tirarD20(3, "normal");
    expect(roll.used).toBe(11);
    expect(roll.total).toBe(14);
    expect(roll.rolls).toEqual([11]);
  });

  it("usa el mayor en ventaja", () => {
    const random = vi.spyOn(Math, "random");
    random.mockReturnValueOnce(0.05).mockReturnValueOnce(0.95);
    const roll = tirarD20(0, "advantage");
    expect(roll.used).toBe(20);
    expect(roll.isCritical).toBe(true);
  });

  it("usa el menor en desventaja", () => {
    const random = vi.spyOn(Math, "random");
    random.mockReturnValueOnce(0.95).mockReturnValueOnce(0.05);
    const roll = tirarD20(0, "disadvantage");
    expect(roll.used).toBe(2);
  });
});
