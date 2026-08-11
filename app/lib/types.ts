export const FINGERS = [
  "leftPinky", "leftRing", "leftMiddle", "leftIndex", "leftThumb",
  "rightThumb", "rightIndex", "rightMiddle", "rightRing", "rightPinky",
] as const;

export type Finger = (typeof FINGERS)[number];
export type FingerMapping = Record<Finger, string[]>;
export type TypingMode = "flow" | "zen" | "freedom" | "workout" | "practice" | "keyboardshot";
export type Theme = "light" | "dark" | "paper" | "forest" | "ocean" | "lavender" | "contrast";
export type CaretAppearance = "highlight" | "underline" | "invisible";
export type Page = "home" | "type" | "analytics" | "settings" | "help";

export interface Settings {
  mapping: FingerMapping;
  sessionType: "timed" | "words" | "endless";
  duration: number;
  minimumGap: number;
  wordCount: number;
  checkBetweenWords: boolean;
  zenBlockSize: number;
  useStandardLetterFrequency: boolean;
  theme: Theme;
  fontSize: number;
  reducedMotion: boolean;
  caretAppearance: CaretAppearance;
  caretBlink: boolean;
  caretColor: string;
  workoutFinger: Finger;
  workoutRepeats: number;
  keyboardshotTargetCount: number;
  keyboardshotGlowFade: boolean;
  keyboardshotHitSounds: boolean;
  resetHotkey: string;
}

export interface Stat {
  attempts: number;
  correct: number;
  incorrect: number;
  totalTime: number;
}

export interface SessionResult {
  id: string;
  date: string;
  mode: TypingMode;
  wpm: number;
  accuracy: number;
  characters: number;
}

export interface AnalyticsData {
  letters: Record<string, Stat>;
  bigrams: Record<string, Stat>;
  sessions: SessionResult[];
}
