import { DEFAULT_MAPPING } from "./defaults";
import type { LeaderboardMode, Settings } from "./types";

export type LeaderboardConfig = {
  key: string;
  label: string;
  scoreLabel: "WPM" | "points";
};

function mappingName(settings: Settings) {
  return JSON.stringify(settings.mapping) === JSON.stringify(DEFAULT_MAPPING) ? "standard mapping" : "custom mapping";
}

export function createLeaderboardConfig(mode: LeaderboardMode, settings: Settings): LeaderboardConfig {
  const session = settings.sessionType === "timed"
    ? { type: "timed", amount: settings.duration, label: `${settings.duration} seconds` }
    : settings.sessionType === "words"
      ? { type: mode === "keyboardshot" ? "targets" : mode === "flow" ? "words" : "blocks", amount: settings.wordCount, label: `${settings.wordCount} ${mode === "keyboardshot" ? "targets" : mode === "flow" ? "words" : "blocks"}` }
      : { type: "endless", amount: 0, label: "endless" };

  let rules: Record<string, string | number | boolean>;
  let labels: string[];
  if (mode === "keyboardshot") {
    rules = {
      targets: settings.keyboardshotTargetCount,
      layout: settings.keyboardshotLayout,
      frequency: settings.useStandardLetterFrequency,
      letters: settings.keyboardshotShowLetters,
      fingerColors: settings.keyboardshotFingerColors,
      trace: settings.keyboardshotTrace,
    };
    labels = [
      `${settings.keyboardshotTargetCount} highlighted`,
      settings.keyboardshotLayout.toUpperCase(),
      settings.useStandardLetterFrequency ? "English frequency" : "even frequency",
      settings.keyboardshotShowLetters ? "letters shown" : "letters hidden",
      settings.keyboardshotFingerColors ? "finger colors" : "single color",
      settings.keyboardshotTrace ? "trace on" : "trace off",
    ];
  } else {
    rules = {
      gap: settings.minimumGap,
      mapping: JSON.stringify(settings.mapping),
      ...(mode === "flow" || mode === "zen" ? { betweenWords: settings.checkBetweenWords } : {}),
      ...(mode === "zen" || mode === "freedom" ? { blockSize: settings.zenBlockSize, frequency: settings.useStandardLetterFrequency } : {}),
    };
    labels = [
      `finger gap ${settings.minimumGap}`,
      mappingName(settings),
      ...(mode === "flow" || mode === "zen" ? [settings.checkBetweenWords ? "word gap checked" : "word gap ignored"] : []),
      ...(mode === "zen" || mode === "freedom" ? [`block size ${settings.zenBlockSize}`, settings.useStandardLetterFrequency ? "English frequency" : "even frequency"] : []),
    ];
  }

  return {
    key: JSON.stringify({ session: { type: session.type, amount: session.amount }, rules }),
    label: [session.label, ...labels].join(" · "),
    scoreLabel: mode === "keyboardshot" ? "points" : "WPM",
  };
}

export function isLeaderboardMode(mode: string): mode is LeaderboardMode {
  return mode === "flow" || mode === "zen" || mode === "freedom" || mode === "keyboardshot";
}
