import { isValidBigram } from "./analytics";
import type { AnalyticsData, Finger, FingerMapping, TypingMode } from "./types";

import { WORDS } from "./words";
import { chooseLetterByFrequency } from "./frequency";

export function getFingerForKey(key: string, mapping: FingerMapping): Finger | undefined {
  return (Object.keys(mapping) as Finger[]).find((finger) => mapping[finger].includes(key));
}

export function isFingerGapValid(text: string, gap: number, mapping: FingerMapping): boolean {
  const recent: Finger[] = [];
  for (const char of text.replaceAll(" ", "")) {
    const finger = getFingerForKey(char, mapping);
    if (!finger) return true; // If the character isn't mapped to a finger, we can't enforce a gap.
    if (recent.slice(-gap).includes(finger)) return false;
    recent.push(finger);
  }
  return true;
}

export function generateFlowText(mapping: FingerMapping, gap: number, count: number, checkBetweenWords = true) {
  const candidates = WORDS.filter((word) => isFingerGapValid(word, gap, mapping));
  if (!candidates.length) {
    return { text: WORDS.slice(0, count).join(" "), warning: "That gap is too restrictive for this word list, so the exercise was gently flow." };
  }
  const chosen: string[] = [];
  let prevWord = "";
  let warningFlag = false;
  for (let l = 0; l < count; l += 1) {
    let word = candidates[Math.floor(Math.random() * candidates.length)];
    let attempts = 0;
    if (checkBetweenWords) {
      while (!isFingerGapValid(prevWord + word, gap, mapping) && attempts < 1000) {
        word = candidates[Math.floor(Math.random() * candidates.length)];
        attempts += 1;
      }
      if (attempts >= 1000) {
        warningFlag = true;
      }
    }
    chosen.push(word);
    prevWord = word;
  }

  return { text: chosen.join(" "), warning: warningFlag ? "That gap is too restrictive for this word list, so the exercise was gently flow." : "" };
}

export function generateZenSequence(mapping: FingerMapping, gap: number, count: number, checkBetweenWords: boolean, blockSize: number, useStandardLetterFrequency = false, random: () => number = Math.random) {
  const letters = Object.values(mapping).flat();
  const result: string[] = [];
  let prevWord = "";
  let curWord = "";
  for (let i = 0; i < count * blockSize; i += 1) {
    const valid = letters.filter((letter) => {
      const trial = prevWord + curWord + letter;
      return isFingerGapValid(trial, gap, mapping);
    });
    const pool = valid.length ? valid : letters;
    const letter = useStandardLetterFrequency
      ? chooseLetterByFrequency(pool, random)
      : pool[Math.floor(random() * pool.length)];
    result.push(letter ?? "z");
    curWord += result[result.length - 1];
    if (blockSize > 0 && (i + 1) % blockSize === 0) {
      result.push(" ");
      prevWord = checkBetweenWords ? curWord : "";
      curWord = "";
    }
  }
  return result.join("").trim();
}

export function generateWorkoutSequence(mapping: FingerMapping, finger: Finger, count: number, repeats: number) {
  const target = mapping[finger].length ? mapping[finger] : ["f"];
  const recovery = Object.entries(mapping).filter(([name]) => name !== finger).flatMap(([, keys]) => keys);
  const chunks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const burst = Array.from({ length: repeats }, (_, n) => target[(i + n) % target.length]).join("");
    chunks.push(burst + (recovery[i % recovery.length] ?? "j"));
  }
  return chunks.join(" ");
}

export function rankTrouble(data: AnalyticsData) {
  const score = ([, stat]: [string, { attempts: number; incorrect: number; totalTime: number }]) =>
    (stat.totalTime / Math.max(1, stat.attempts)) + (stat.incorrect / Math.max(1, stat.attempts)) * 600;
  return Object.entries(data.bigrams).filter(([key, s]) => isValidBigram(key) && s.attempts >= 2).sort((a, b) => score(b) - score(a)).slice(0, 3).map(([key]) => key);
}

export function generateTargetedPractice(data: AnalyticsData, count = 28) {
  const targets = rankTrouble(data);
  const sample = "the calm river moves under a bright open sky we learn with every small step".split(" ");
  if (!targets.length) return { text: Array.from({ length: count }, (_, index) => sample[index % sample.length]).join(" "), targets: [] };
  const woven = WORDS.filter((word) => targets.some((target) => word.includes(target)));
  const pool = [...woven, ...WORDS, ...targets];
  return { text: Array.from({ length: count }, (_, index) => pool[index % pool.length]).join(" "), targets };
}

export function generateExercise(mode: TypingMode, mapping: FingerMapping, gap: number, count:number, checkBetweenWords: boolean, block: number, finger: Finger, repeats: number, analytics: AnalyticsData, useStandardLetterFrequency = false) {
  if (mode === "zen" || mode === "freedom") return { text: generateZenSequence(mapping, gap, count, checkBetweenWords && mode === "zen", block, useStandardLetterFrequency), warning: "" };
  if (mode === "workout") return { text: generateWorkoutSequence(mapping, finger, count, repeats), warning: "" };
  if (mode === "practice") return { ...generateTargetedPractice(analytics, count), warning: "" };
  return generateFlowText(mapping, gap, count, checkBetweenWords);
}
