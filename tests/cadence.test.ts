import { describe, expect, it } from "vitest";
import { calculateCadenceActiveElapsed, calculateCadenceCaretIndex, calculateCadenceTimerElapsed } from "../app/lib/cadence";

describe("Cadence active time", () => {
  it("does not add time while paused between blocks", () => {
    const firstBlockTime = calculateCadenceActiveElapsed(0, 1_000, 1_800);
    const afterFiveSecondPause = calculateCadenceActiveElapsed(firstBlockTime, null, 6_800);

    expect(firstBlockTime).toBe(800);
    expect(afterFiveSecondPause).toBe(800);
  });

  it("adds only the next active typing segment after a pause", () => {
    const elapsed = calculateCadenceActiveElapsed(800, 6_800, 7_200);

    expect(elapsed).toBe(1_200);
  });

  it("continues timed-session tracking while active time is paused", () => {
    const activeElapsed = calculateCadenceActiveElapsed(800, null, 6_800);
    const timerElapsed = calculateCadenceTimerElapsed(1_000, 6_800);

    expect(activeElapsed).toBe(800);
    expect(timerElapsed).toBe(5_800);
  });

  it("pins the caret to the final block letter until the pause ends", () => {
    expect(calculateCadenceCaretIndex(3, true)).toBe(2);
    expect(calculateCadenceCaretIndex(4, false)).toBe(4);
  });

});
