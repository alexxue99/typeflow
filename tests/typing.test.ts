import { describe, expect, it } from "vitest";
import { advanceToNextWord, backspaceTypedCharacters, isExtraWordCharacter } from "../app/lib/typing";

describe("word navigation", () => {
  it("advances from within a word to the start of the next word", () => {
    expect(advanceToNextWord("hello world", 2)).toEqual(["", "", "", " "]);
  });

  it("advances over a separator when a word has just been completed", () => {
    expect(advanceToNextWord("hello world", 5)).toEqual([" "]);
  });

  it("advances to the end when there is no next word", () => {
    expect(advanceToNextWord("hello", 2)).toEqual(["", "", ""]);
  });
});

describe("word input boundaries", () => {
  it("rejects extra letters after a completed word", () => {
    expect(isExtraWordCharacter("hello world", 5, "o")).toBe(true);
  });

  it("allows the space that advances to the next word", () => {
    expect(isExtraWordCharacter("hello world", 5, " ")).toBe(false);
  });

  it("allows letters while the current word is incomplete", () => {
    expect(isExtraWordCharacter("hello world", 4, "x")).toBe(false);
  });
});

describe("backspacing", () => {
  it("removes the most recently typed character", () => {
    expect(backspaceTypedCharacters(["h", "e", "x"])).toEqual(["h", "e"]);
  });

  it("does nothing when no characters have been typed", () => {
    expect(backspaceTypedCharacters([])).toEqual([]);
  });
});
