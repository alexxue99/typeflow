import type { LeaderboardMode, Settings } from "./types";

export type LeaderboardConfig = {
  key: string;
  label: string;
  scoreLabel: "WPM" | "points" | "Time";
  scoreKind: "higher" | "time";
};

export function createLeaderboardConfig(mode: LeaderboardMode, settings: Settings): LeaderboardConfig {
  const scoreKind = mode === "keyboardshot" && settings.sessionType === "words" ? "time" : "higher";
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
      //layout: settings.keyboardshotLayout,
      frequency: settings.useStandardLetterFrequency,
      letters: settings.keyboardshotShowLetters,
      //fingerColors: settings.keyboardshotFingerColors,
      //trace: settings.keyboardshotTrace,
    };
    labels = [
      `${settings.keyboardshotTargetCount} keys highlighted`,
      //settings.keyboardshotLayout.toUpperCase(),
      settings.useStandardLetterFrequency ? "standard letter frequency on" : "standard letter frequency off",
      settings.keyboardshotShowLetters ? "letters shown" : "letters hidden",
      // settings.keyboardshotFingerColors ? "finger colors" : "single color",
      // settings.keyboardshotTrace ? "trace on" : "trace off",
    ];
  } else {
    rules = {
      gap: settings.minimumGap,
      ...(mode === "flow" || mode === "zen" ? { betweenWords: true } : {}),
      ...(mode === "zen" || mode === "freedom" ? { blockSize: settings.zenBlockSize, frequency: settings.useStandardLetterFrequency } : {}),
    };
    labels = [
      `finger gap ${settings.minimumGap}`,
      ...(mode === "zen" || mode === "freedom" ? [`block size ${settings.zenBlockSize}`, settings.useStandardLetterFrequency ? "standard letter frequency on" : "standard letter frequency off"] : []),
    ];
  }

  return {
    key: JSON.stringify({ session: { type: session.type, amount: session.amount, ...(scoreKind === "time" ? { scoring: "elapsed-ms" } : {}) }, rules }),
    label: [session.label, ...labels].join(" · "),
    scoreLabel: scoreKind === "time" ? "Time" : mode === "keyboardshot" ? "points" : "WPM",
    scoreKind,
  };
}

export function isTimeLeaderboard(mode: string, configKey: string) {
  if (mode !== "keyboardshot") return false;
  try {
    const config = JSON.parse(configKey) as { session?: { scoring?: unknown } };
    return config.session?.scoring === "elapsed-ms";
  } catch {
    return false;
  }
}

export function formatLeaderboardScore(value: number, config: LeaderboardConfig) {
  return config.scoreKind === "time" ? `${(value / 1000).toFixed(3)}s` : `${value} ${config.scoreLabel}`;
}

export function isLeaderboardMode(mode: string): mode is LeaderboardMode {
  return mode === "flow" || mode === "zen" || mode === "freedom" || mode === "keyboardshot";
}
