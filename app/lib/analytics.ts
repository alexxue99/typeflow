import type { AnalyticsData, SessionResult, Stat, TypingMode } from "./types";

export function collectsAnalytics(mode: TypingMode): boolean {
  return mode === "flow";
}

function updateStat(current: Stat | undefined, correct: boolean, interval: number): Stat {
  const stat = current ?? { attempts: 0, correct: 0, incorrect: 0, totalTime: 0 };
  return {
    attempts: stat.attempts + 1,
    correct: stat.correct + (correct ? 1 : 0),
    incorrect: stat.incorrect + (correct ? 0 : 1),
    // Pauses above 2 seconds are excluded from normal typing timing.
    totalTime: stat.totalTime + (interval <= 2000 ? interval : 0),
  };
}

export function recordKeystroke(data: AnalyticsData, expected: string, typed: string, previous: string, interval: number): AnalyticsData {
  const letters = { ...data.letters, [expected]: updateStat(data.letters[expected], expected === typed, interval) };
  const bigram = previous && expected !== " " ? previous + expected : "";
  const bigrams = bigram ? { ...data.bigrams, [bigram]: updateStat(data.bigrams[bigram], expected === typed, interval) } : data.bigrams;
  return { ...data, letters, bigrams };
}

export function calculateResult(mode: TypingMode, correct: number, attempts: number, elapsedSeconds: number): SessionResult {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode,
    wpm: Math.round((correct / 5) / Math.max(elapsedSeconds / 60, 1 / 60)),
    accuracy: Math.round((correct / Math.max(1, attempts)) * 100),
    characters: attempts,
  };
}
