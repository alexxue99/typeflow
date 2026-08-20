import { DEFAULT_SETTINGS } from "./defaults";
import type { Settings, TypingMode } from "./types";

const DEFAULT_SESSION_SETTINGS = {
  sessionType: DEFAULT_SETTINGS.sessionType,
  duration: DEFAULT_SETTINGS.duration,
  wordCount: DEFAULT_SETTINGS.wordCount,
};

export function withDefaultTestSettings(settings: Settings, mode: TypingMode): Settings {
  if (mode === "flow") {
    return {
      ...settings,
      ...DEFAULT_SESSION_SETTINGS,
      minimumGap: DEFAULT_SETTINGS.minimumGap,
    };
  }

  if (mode === "zen" || mode === "cadence") {
    return {
      ...settings,
      ...DEFAULT_SESSION_SETTINGS,
      minimumGap: DEFAULT_SETTINGS.minimumGap,
      zenBlockSize: DEFAULT_SETTINGS.zenBlockSize,
      ...(mode === "cadence" ? { cadenceDelay: DEFAULT_SETTINGS.cadenceDelay } : {}),
      useStandardLetterFrequency: DEFAULT_SETTINGS.useStandardLetterFrequency,
    };
  }

  if (mode === "keyboardshot") {
    return {
      ...settings,
      ...DEFAULT_SESSION_SETTINGS,
      useStandardLetterFrequency: DEFAULT_SETTINGS.useStandardLetterFrequency,
      keyboardshotTargetCount: DEFAULT_SETTINGS.keyboardshotTargetCount,
      keyboardshotLayout: DEFAULT_SETTINGS.keyboardshotLayout,
      keyboardshotShowLetters: DEFAULT_SETTINGS.keyboardshotShowLetters,
    };
  }

  return settings;
}
