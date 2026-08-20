import { describe, expect, it } from "vitest";
import { calculateResult, collectsAnalytics, isValidBigram, recordKeystroke } from "../app/lib/analytics";
import { EMPTY_ANALYTICS } from "../app/lib/defaults";

describe("analytics updates", () => {
  it("stores WPM as a hundredths-scaled integer", () => {
    expect(calculateResult("flow", 50, 50, 61).wpm_scaled).toBe(984);
  });
  it("collects analytics only in Flow mode", () => {
    expect(collectsAnalytics("flow")).toBe(true);
    expect(["zen", "cadence", "workout", "practice", "keyboardshot"].every((mode) => !collectsAnalytics(mode as Parameters<typeof collectsAnalytics>[0]))).toBe(true);
  });
  it("updates letter and bigram statistics", () => {
    let data = recordKeystroke(EMPTY_ANALYTICS, "t", "t", "", 120);
    data = recordKeystroke(data, "r", "x", "t", 200);
    expect(data.letters.r.incorrect).toBe(1);
    expect(data.bigrams.tr.attempts).toBe(1);
  });
  it("does not record word boundaries as bigrams", () => {
    const afterSpace = recordKeystroke(EMPTY_ANALYTICS, "a", "a", " ", 120);
    const beforeSpace = recordKeystroke(EMPTY_ANALYTICS, " ", " ", "a", 120);

    expect(afterSpace.bigrams).toEqual({});
    expect(beforeSpace.bigrams).toEqual({});
    expect(isValidBigram(" a")).toBe(false);
    expect(isValidBigram("a ")).toBe(false);
    expect(isValidBigram("tr")).toBe(true);
  });
  it("excludes unusually long pauses from timing", () => {
    const data = recordKeystroke(EMPTY_ANALYTICS, "a", "a", "", 5000);
    expect(data.letters.a.totalTime).toBe(0);
  });
});
