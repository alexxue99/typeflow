import { describe, expect, it } from "vitest";
import type { UserBest } from "../app/lib/types";
import { filterUserBests, readUserStatsSession, userStatsRulesLabel } from "../app/lib/userStats";

function best(mode: UserBest["mode"], session: { type: string; amount: number }): UserBest {
  return {
    mode,
    configKey: JSON.stringify({ session, rules: {} }),
    configLabel: `${session.amount} ${session.type}`,
    score: 90,
    accuracy: 98,
    elapsed: 30,
    updatedAt: "2026-08-19",
  };
}

describe("user stats filters", () => {
  const bests = [best("flow", { type: "time", amount: 15 }), best("flow", { type: "words", amount: 25 }), best("zen", { type: "blocks", amount: 25 }), best("keyboardshot", { type: "targets", amount: 50 })];

  it("normalizes fixed-length sessions to the words category", () => {
    expect(readUserStatsSession(bests[2])).toEqual({ type: "words", amount: 25, unit: "blocks" });
    expect(readUserStatsSession(bests[3])).toEqual({ type: "words", amount: 50, unit: "targets" });
  });

  it("filters by mode, session type, and amount", () => {
    expect(filterUserBests(bests, { mode: "flow", sessionType: "all", amount: "all" })).toHaveLength(2);
    expect(filterUserBests(bests, { mode: "all", sessionType: "words", amount: "all" })).toHaveLength(3);
    expect(filterUserBests(bests, { mode: "all", sessionType: "all", amount: "words:25" }).map((item) => item.mode)).toEqual(["flow", "zen"]);
  });

  it("separates the session amount from the competitive settings label", () => {
    expect(userStatsRulesLabel({ ...bests[0], configLabel: "15 seconds · finger gap 4 · standard frequency on" })).toBe("finger gap 4 · standard frequency on");
    expect(userStatsRulesLabel({ ...bests[0], configLabel: "Legacy setting" })).toBe("Legacy setting");
  });
});
