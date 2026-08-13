import { describe, expect, it } from "vitest";
import { DEFAULT_MAPPING, EMPTY_ANALYTICS } from "../app/lib/defaults";
import { generateFlowText, generateTargetedPractice, generateZenSequence, getFingerForKey, isFingerGapValid, rankTrouble } from "../app/lib/generators";
import { WORDS } from "../app/lib/words";
import { chooseLetterByFrequency } from "../app/lib/frequency";

describe("finger mapping and generation", () => {
  it("contains no invalid single-letter entries", () => {
    expect(WORDS.filter((word) => word.length === 1)).toEqual(["a"]);
  });

  it("maps a key to its finger", () => expect(getFingerForKey("f", DEFAULT_MAPPING)).toBe("leftIndex"));
  it("enforces a minimum finger gap", () => {
    expect(isFingerGapValid("fj", 1, DEFAULT_MAPPING)).toBe(true);
    expect(isFingerGapValid("fr", 1, DEFAULT_MAPPING)).toBe(false);
  });
  it("creates valid zen sequences", () => {
    const text = generateZenSequence(DEFAULT_MAPPING, 1, 40, true, 4);
    expect(isFingerGapValid(text, 1, DEFAULT_MAPPING)).toBe(true);
    expect(text).toContain(" ");
  });
  it("selects letters using the standard frequency weights", () => {
    expect(chooseLetterByFrequency(["z", "e"], () => 0.5)).toBe("e");
    const text = generateZenSequence(DEFAULT_MAPPING, 0, 1, false, 1, true, () => 0.1);
    expect(text).toBe("w");
  });
  it("handles restrictive flow settings without looping forever", () => {
    const result = generateFlowText(DEFAULT_MAPPING, 5, 10);
    expect(result.text.length).toBeGreaterThan(0);
  });
  it("falls back to a sample practice when analytics are empty", () => {
    expect(generateTargetedPractice(EMPTY_ANALYTICS).targets).toEqual([]);
    expect(generateTargetedPractice(EMPTY_ANALYTICS, 37).text.split(" ")).toHaveLength(37);
  });
  it("generates the requested number of personalized practice words", () => {
    const data = { ...EMPTY_ANALYTICS, bigrams: {
      th: { attempts: 5, correct: 2, incorrect: 3, totalTime: 3000 },
    }};
    expect(generateTargetedPractice(data, 43).text.split(" ")).toHaveLength(43);
  });
  it("ranks difficult bigrams", () => {
    const data = { ...EMPTY_ANALYTICS, bigrams: {
      th: { attempts: 5, correct: 5, incorrect: 0, totalTime: 500 },
      lo: { attempts: 5, correct: 2, incorrect: 3, totalTime: 3000 },
    }};
    expect(rankTrouble(data)[0]).toBe("lo");
  });
});
