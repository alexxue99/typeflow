import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../app/lib/defaults";
import { createLeaderboardConfig, formatLeaderboardScore, isTimeLeaderboard } from "../app/lib/leaderboard";

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

  it("describes Keyboardshot assistance settings", () => {
    const config = createLeaderboardConfig("keyboardshot", {
      ...DEFAULT_SETTINGS,
      keyboardshotLayout: "dvorak",
      keyboardshotShowLetters: false,
      keyboardshotTargetCount: 4,
    });

    expect(config.scoreLabel).toBe("points");
    expect(config.label).toContain("4 keys highlighted");
    expect(config.label).toContain("standard letter frequency on");
    expect(config.label).toContain("letters hidden");
  });

  it("uses the right fixed-length unit for every mode", () => {
    const settings = { ...DEFAULT_SETTINGS, sessionType: "words" as const, wordCount: 40 };

    expect(createLeaderboardConfig("flow", settings).label).toContain("40 words");
    expect(createLeaderboardConfig("zen", settings).label).toContain("40 blocks");
    expect(createLeaderboardConfig("freedom", settings).label).toContain("40 blocks");
    expect(createLeaderboardConfig("keyboardshot", settings).label).toContain("40 targets");
  });

  it("ranks fixed-target Keyboardshot sessions by millisecond time", () => {
    const config = createLeaderboardConfig("keyboardshot", {
      ...DEFAULT_SETTINGS,
      sessionType: "words",
      wordCount: 25,
    });

    expect(config.scoreKind).toBe("time");
    expect(config.scoreLabel).toBe("Time");
    expect(isTimeLeaderboard("keyboardshot", config.key)).toBe(true);
    expect(formatLeaderboardScore(1234, config)).toBe("1.234s");
  });

  it("keeps timed Keyboardshot sessions ranked by points", () => {
    const config = createLeaderboardConfig("keyboardshot", DEFAULT_SETTINGS);

    expect(config.scoreKind).toBe("higher");
    expect(config.scoreLabel).toBe("points");
    expect(isTimeLeaderboard("keyboardshot", config.key)).toBe(false);
  });
});
