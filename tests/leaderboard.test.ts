import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../app/lib/defaults";
import { createLeaderboardConfig } from "../app/lib/leaderboard";

describe("leaderboard configurations", () => {
  it("separates boards when a competitive setting changes", () => {
    const baseline = createLeaderboardConfig("flow", DEFAULT_SETTINGS);
    const longer = createLeaderboardConfig("flow", { ...DEFAULT_SETTINGS, duration: 60 });
    const widerGap = createLeaderboardConfig("flow", { ...DEFAULT_SETTINGS, minimumGap: 3 });

    expect(longer.key).not.toBe(baseline.key);
    expect(widerGap.key).not.toBe(baseline.key);
    expect(baseline.label).toContain("30 seconds");
    expect(baseline.label).toContain("finger gap 1");
  });

  it("describes Keyboardshot assistance and layout settings", () => {
    const config = createLeaderboardConfig("keyboardshot", {
      ...DEFAULT_SETTINGS,
      keyboardshotLayout: "dvorak",
      keyboardshotShowLetters: false,
      keyboardshotTargetCount: 4,
    });

    expect(config.scoreLabel).toBe("points");
    expect(config.label).toContain("4 highlighted");
    expect(config.label).toContain("DVORAK");
    expect(config.label).toContain("letters hidden");
  });

  it("uses the right fixed-length unit for every mode", () => {
    const settings = { ...DEFAULT_SETTINGS, sessionType: "words" as const, wordCount: 40 };

    expect(createLeaderboardConfig("flow", settings).label).toContain("40 words");
    expect(createLeaderboardConfig("zen", settings).label).toContain("40 blocks");
    expect(createLeaderboardConfig("freedom", settings).label).toContain("40 blocks");
    expect(createLeaderboardConfig("keyboardshot", settings).label).toContain("40 targets");
  });
});
