import type { AnalyticsData, FingerMapping, Settings } from "./types";

export const DEFAULT_MAPPING: FingerMapping = {
  leftPinky: ["q", "a", "z"],
  leftRing: ["w", "s", "x"],
  leftMiddle: ["e", "d", "c"],
  leftIndex: ["r", "f", "v", "t", "g", "b"],
  leftThumb: [],
  rightThumb: [],
  rightIndex: ["y", "h", "n", "u", "j", "m"],
  rightMiddle: ["i", "k"],
  rightRing: ["o", "l"],
  rightPinky: ["p"],
};

export const DEFAULT_SETTINGS: Settings = {
  mapping: DEFAULT_MAPPING,
  sessionType: "time",
  duration: 15,
  minimumGap: 3,
  wordCount: 25,
  zenBlockSize: 3,
  useStandardLetterFrequency: true,
  theme: "ocean",
  fontSize: 30,
  reducedMotion: false,
  hideCursorDuringTests: true,
  caretAppearance: "underline-letter",
  caretBlink: false,
  caretColor: "#d95f3d",
  workoutFinger: "rightIndex",
  workoutRepeats: 3,
  keyboardshotTargetCount: 5,
  keyboardshotGlowFade: true,
  keyboardshotHitSounds: false,
  keyboardshotLayout: "qwerty",
  keyboardshotShowLetters: true,
  keyboardshotFingerColors: false,
  keyboardshotTrace: false,
  resetHotkey: "Tab",
};

export const EMPTY_ANALYTICS: AnalyticsData = { letters: {}, bigrams: {}, sessions: [] };

export const FINGER_LABELS: Record<keyof FingerMapping, string> = {
  leftPinky: "Left pinky", leftRing: "Left ring", leftMiddle: "Left middle",
  leftIndex: "Left index", leftThumb: "Left thumb", rightThumb: "Right thumb",
  rightIndex: "Right index", rightMiddle: "Right middle", rightRing: "Right ring",
  rightPinky: "Right pinky",
};
