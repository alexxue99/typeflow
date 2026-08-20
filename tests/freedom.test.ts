import { describe, expect, it } from "vitest";
import { calculateFreedomWpmScaled, consumeBlockLetter, findIncompleteBlockLetters, isFreedomBlockComplete } from "../app/lib/freedom";

describe("Freedom blocks", () => {
  it("accepts letters in any order", () => {
    expect(consumeBlockLetter("abc", [false, false, false], "c")).toEqual([false, false, true]);
  });
  it("consumes only one copy of a repeated letter", () => {
    expect(consumeBlockLetter("aba", [false, false, false], "a")).toEqual([true, false, false]);
  });
  it("rejects letters that are absent or already consumed", () => {
    expect(consumeBlockLetter("abc", [true, false, false], "a")).toBeNull();
    expect(consumeBlockLetter("abc", [false, false, false], "x")).toBeNull();
  });
  it("marks every unfinished letter incomplete when advancing", () => {
    expect(findIncompleteBlockLetters([true, false, true])).toEqual([false, true, false]);
  });
  it("has no incomplete letters when the whole block was typed", () => {
    expect(findIncompleteBlockLetters([true, true, true])).toEqual([false, false, false]);
  });
  it("completes a block only after all of its characters were typed", () => {
    expect(isFreedomBlockComplete([true, true, false])).toBe(false);
    expect(isFreedomBlockComplete([true, true, true])).toBe(true);
  });
  it("includes spaces in WPM", () => {
    expect(calculateFreedomWpmScaled(45, 5, 60)).toBe(1000);
  });
  it("keeps two decimal places of WPM precision", () => {
    expect(calculateFreedomWpmScaled(45, 5, 61)).toBe(984);
  });
});
