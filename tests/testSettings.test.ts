import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../app/lib/defaults";
import { withDefaultTestSettings } from "../app/lib/testSettings";

describe("withDefaultTestSettings", () => {
  it("resets flow test settings without changing unrelated preferences", () => {
    const customized = {
      ...DEFAULT_SETTINGS,
      sessionType: "words" as const,
      duration: 120,
      wordCount: 100,
      minimumGap: 0,
      theme: "dark" as const,
      keyboardshotTargetCount: 1,
    };

    const reset = withDefaultTestSettings(customized, "flow");

    expect(reset).toMatchObject({
      sessionType: DEFAULT_SETTINGS.sessionType,
      duration: DEFAULT_SETTINGS.duration,
      wordCount: DEFAULT_SETTINGS.wordCount,
      minimumGap: DEFAULT_SETTINGS.minimumGap,
      theme: "dark",
      keyboardshotTargetCount: 1,
    });
  });

  it("resets zen and cadence-specific test settings", () => {
    for (const mode of ["zen", "cadence"] as const) {
      const reset = withDefaultTestSettings({
        ...DEFAULT_SETTINGS,
        zenBlockSize: 9,
        cadenceDelay: 0.5,
        cadenceBlockSound: true,
        useStandardLetterFrequency: false,
      }, mode);

      expect(reset.zenBlockSize).toBe(DEFAULT_SETTINGS.zenBlockSize);
      expect(reset.useStandardLetterFrequency).toBe(DEFAULT_SETTINGS.useStandardLetterFrequency);
      expect(reset.cadenceDelay).toBe(mode === "cadence" ? DEFAULT_SETTINGS.cadenceDelay : 0.5);
      expect(reset.cadenceBlockSound).toBe(true);
    }
  });

  it("resets core keyboardshot controls while preserving optional effects", () => {
    const reset = withDefaultTestSettings({
      ...DEFAULT_SETTINGS,
      minimumGap: 1,
      keyboardshotTargetCount: 1,
      keyboardshotGlowFade: false,
      keyboardshotHitSounds: true,
      keyboardshotLayout: "dvorak",
      keyboardshotShowLetters: false,
      keyboardshotFingerColors: true,
      keyboardshotTrace: true,
      useStandardLetterFrequency: false,
    }, "keyboardshot");

    expect(reset).toMatchObject({
      minimumGap: 1,
      keyboardshotTargetCount: DEFAULT_SETTINGS.keyboardshotTargetCount,
      keyboardshotGlowFade: false,
      keyboardshotHitSounds: true,
      keyboardshotLayout: DEFAULT_SETTINGS.keyboardshotLayout,
      keyboardshotShowLetters: DEFAULT_SETTINGS.keyboardshotShowLetters,
      keyboardshotFingerColors: true,
      keyboardshotTrace: true,
      useStandardLetterFrequency: DEFAULT_SETTINGS.useStandardLetterFrequency,
    });
  });
});
