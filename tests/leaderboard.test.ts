import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../app/lib/defaults";
import { createLeaderboardConfig, formatLeaderboardScore, isTimeLeaderboard } from "../app/lib/leaderboard";

describe("leaderboard configurations", () => {
  it("separates boards when a competitive setting changes", () => {
    const baseline = createLeaderboardConfig("flow", DEFAULT_SETTINGS);
    const differentDuration = createLeaderboardConfig("flow", { ...DEFAULT_SETTINGS, duration: DEFAULT_SETTINGS.duration === 60 ? 30 : 60 });
    const differentGap = createLeaderboardConfig("flow", { ...DEFAULT_SETTINGS, minimumGap: DEFAULT_SETTINGS.minimumGap === 4 ? 0 : DEFAULT_SETTINGS.minimumGap + 1 });

    expect(differentDuration.key).not.toBe(baseline.key);
    expect(differentGap.key).not.toBe(baseline.key);
    expect(baseline.label).toContain(`time ${DEFAULT_SETTINGS.duration}`);
    expect(baseline.label).toContain(`finger gap ${DEFAULT_SETTINGS.minimumGap}`);
  });

  it("describes Keyboardshot assistance settings", () => {
    const config = createLeaderboardConfig("keyboardshot", {
      ...DEFAULT_SETTINGS,
      keyboardshotLayout: "dvorak",
      keyboardshotShowLetters: false,
      keyboardshotTargetCount: 4,
    });

    expect(config.scoreLabel).toBe("points");
    expect(config.label).toContain("keys highlighted 4");
    expect(config.label).toContain("standard letter frequency on");
    expect(config.label).toContain("letters hidden");
  });

  it("uses the right fixed-length unit for every mode", () => {
    const settings = { ...DEFAULT_SETTINGS, sessionType: "words" as const, wordCount: 40 };

    expect(createLeaderboardConfig("flow", settings).label).toContain("words 40");
    expect(createLeaderboardConfig("zen", settings).label).toContain("blocks 40");
    expect(createLeaderboardConfig("freedom", settings).label).toContain("blocks 40");
    expect(createLeaderboardConfig("keyboardshot", settings).label).toContain("targets 40");
  });

  it("ranks all fixed-length sessions by millisecond time", () => {
    const settings = { ...DEFAULT_SETTINGS, sessionType: "words" as const, wordCount: 25 };

    for (const mode of ["flow", "zen", "freedom", "keyboardshot"] as const) {
      const config = createLeaderboardConfig(mode, settings);
      expect(config.scoreKind).toBe("time");
      expect(config.scoreLabel).toBe("Time");
      expect(isTimeLeaderboard(mode, config.key)).toBe(true);
      expect(formatLeaderboardScore(1234, config)).toBe("1.234s");
    }
  });

  it("keeps timed Keyboardshot sessions ranked by points", () => {
    const config = createLeaderboardConfig("keyboardshot", DEFAULT_SETTINGS);

    expect(config.scoreKind).toBe("higher");
    expect(config.scoreLabel).toBe("points");
    expect(isTimeLeaderboard("keyboardshot", config.key)).toBe(false);
  });
});
