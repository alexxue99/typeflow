import { describe, expect, it } from "vitest";
import { collectsAnalytics, recordKeystroke } from "../app/lib/analytics";
import { EMPTY_ANALYTICS } from "../app/lib/defaults";

describe("analytics updates", () => {
  it("collects analytics only in Flow mode", () => {
    expect(collectsAnalytics("flow")).toBe(true);
    expect(["zen", "freedom", "workout", "practice", "keyboardshot"].every((mode) => !collectsAnalytics(mode as Parameters<typeof collectsAnalytics>[0]))).toBe(true);
  });
  it("updates letter and bigram statistics", () => {
    let data = recordKeystroke(EMPTY_ANALYTICS, "t", "t", "", 120);
    data = recordKeystroke(data, "r", "x", "t", 200);
    expect(data.letters.r.incorrect).toBe(1);
    expect(data.bigrams.tr.attempts).toBe(1);
  });
  it("excludes unusually long pauses from timing", () => {
    const data = recordKeystroke(EMPTY_ANALYTICS, "a", "a", "", 5000);
    expect(data.letters.a.totalTime).toBe(0);
  });
});
