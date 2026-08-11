import { chooseLetterByFrequency } from "./frequency";

export const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

export const KEYBOARD_KEYS: readonly string[] = KEYBOARD_ROWS.flat();

export function createTargets(count = 3, random: () => number = Math.random, useStandardLetterFrequency = false): string[] {
  const pool = [...KEYBOARD_KEYS];
  const targets: string[] = [];
  const targetCount = Math.min(6, Math.max(1, Math.floor(count)));
  while (targets.length < targetCount) {
    const selected = useStandardLetterFrequency
      ? chooseLetterByFrequency(pool, random)
      : pool[Math.floor(random() * pool.length)];
    targets.push(pool.splice(pool.indexOf(selected ?? pool[0]), 1)[0]);
  }
  return targets;
}

export function replaceTarget(targets: string[], pressed: string, random: () => number = Math.random, useStandardLetterFrequency = false): string[] {
  const targetIndex = targets.indexOf(pressed);
  if (targetIndex < 0) return targets;
  const choices = KEYBOARD_KEYS.filter((key) => !targets.includes(key));
  const next = [...targets];
  next[targetIndex] = useStandardLetterFrequency
    ? chooseLetterByFrequency(choices, random) ?? choices[0]
    : choices[Math.floor(random() * choices.length)];
  return next;
}
