export const FINGERS = [
  "leftPinky", "leftRing", "leftMiddle", "leftIndex", "leftThumb",
  "rightThumb", "rightIndex", "rightMiddle", "rightRing", "rightPinky",
] as const;

export type Finger = (typeof FINGERS)[number];
export type FingerMapping = Record<Finger, string[]>;
export type TypingMode = "flow" | "zen" | "freedom" | "workout" | "practice" | "keyboardshot";
export type Theme = "light" | "dark" | "paper" | "forest" | "ocean" | "lavender" | "contrast";
export type CaretAppearance = "highlight" | "underline" | "underline-letter" | "invisible";
export type KeyboardLayout = "qwerty" | "dvorak";
export type Page = "home" | "type" | "stats" | "analytics" | "settings" | "help" | "sign-in" | "sign-up";

export interface Settings {
  mapping: FingerMapping;
  sessionType: "time" | "words" | "endless";
  duration: number;
  minimumGap: number;
  wordCount: number;
  zenBlockSize: number;
  useStandardLetterFrequency: boolean;
  theme: Theme;
  fontSize: number;
  reducedMotion: boolean;
  hideCursorDuringTests: boolean;
  caretAppearance: CaretAppearance;
  caretBlink: boolean;
  caretColor: string;
  workoutFinger: Finger;
  workoutRepeats: number;
  keyboardshotTargetCount: number;
  keyboardshotGlowFade: boolean;
  keyboardshotHitSounds: boolean;
  keyboardshotLayout: KeyboardLayout;
  keyboardshotShowLetters: boolean;
  keyboardshotFingerColors: boolean;
  keyboardshotTrace: boolean;
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
  wpm_scaled: number;
  accuracy: number;
  characters: number;
}

export interface AnalyticsData {
  letters: Record<string, Stat>;
  bigrams: Record<string, Stat>;
  sessions: SessionResult[];
}

export type LeaderboardMode = Extract<TypingMode, "flow" | "zen" | "freedom" | "keyboardshot">;

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  accuracy: number;
  elapsed: number;
  isYou: boolean;
}

export interface PersonalBest {
  score: number;
  accuracy: number;
  elapsed: number;
}

export interface UserBest extends PersonalBest {
  mode: LeaderboardMode;
  configKey: string;
  configLabel: string;
  updatedAt: string;
}
