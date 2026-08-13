import { describe, expect, it } from "vitest";
import { createTargets, DVORAK_ROWS, fingerForPosition, keyboardRows, KEYBOARD_KEYS, QWERTY_ROWS, replaceTarget } from "../app/lib/keyboardshot";

describe("Keyboardshot targets", () => {
  it("starts with three distinct keyboard keys", () => {
    const targets = createTargets(3, () => 0);
    expect(targets).toHaveLength(3);
    expect(new Set(targets).size).toBe(3);
    expect(targets.every((key) => KEYBOARD_KEYS.includes(key))).toBe(true);
  });

  it("creates the configured number of targets from one to six", () => {
    for (let count = 1; count <= 6; count += 1) {
      const targets = createTargets(count, () => 0);
      expect(targets).toHaveLength(count);
      expect(new Set(targets).size).toBe(count);
    }
  });

  it("can choose targets using standard letter frequencies", () => {
    expect(createTargets(1, () => 0.05, true)).toEqual(["e"]);
  });

  it("replaces only the pressed target with a fresh key", () => {
    const next = replaceTarget(["q", "w", "e"], "w", () => 0);
    expect(next[0]).toBe("q");
    expect(next[2]).toBe("e");
    expect(next[1]).not.toBe("w");
    expect(new Set(next).size).toBe(3);
  });

  it("does not change targets after a miss", () => {
    const targets = ["q", "w", "e"];
    expect(replaceTarget(targets, "x", () => 0)).toBe(targets);
  });

  it("switches between QWERTY and DVORAK rows", () => {
    expect(keyboardRows("qwerty")).toBe(QWERTY_ROWS);
    expect(keyboardRows("dvorak")).toBe(DVORAK_ROWS);
    expect(DVORAK_ROWS.flat()).toContain("q");
  });

  it("assigns physical key positions to touch-typing finger groups", () => {
    expect(fingerForPosition(0, 0)).toBe("pinky");
    expect(fingerForPosition(0, 1)).toBe("ring");
    expect(fingerForPosition(0, 2)).toBe("middle");
    expect(fingerForPosition(0, 3)).toBe("index");
  });
});
