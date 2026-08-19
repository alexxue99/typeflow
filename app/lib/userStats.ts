import type { LeaderboardMode, UserBest } from "./types";

export type UserStatsSessionType = "timed" | "words";

export type UserStatsFilters = {
  mode: LeaderboardMode | "all";
  sessionType: UserStatsSessionType | "all";
  amount: string;
};

export type UserStatsSession = {
  type: UserStatsSessionType;
  amount: number;
  unit: "seconds" | "words" | "blocks" | "targets";
};

type StoredConfig = {
  session?: {
    type?: unknown;
    amount?: unknown;
  };
};

export function readUserStatsSession(best: UserBest): UserStatsSession | null {
  try {
    const config = JSON.parse(best.configKey) as StoredConfig;
    const storedType = config.session?.type;
    const amount = config.session?.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount)) return null;

    if (storedType === "timed") return { type: "timed", amount, unit: "seconds" };
    if (storedType === "words" || storedType === "blocks" || storedType === "targets") {
      return { type: "words", amount, unit: storedType };
    }
  } catch {
    // Ignore legacy or malformed configuration keys.
  }
  return null;
}

export function userStatsAmountKey(session: Pick<UserStatsSession, "type" | "amount">) {
  return `${session.type}:${session.amount}`;
}

export function filterUserBests(bests: UserBest[], filters: UserStatsFilters) {
  return bests.filter((best) => {
    if (filters.mode !== "all" && best.mode !== filters.mode) return false;
    const session = readUserStatsSession(best);
    if (!session) return filters.sessionType === "all" && filters.amount === "all";
    if (filters.sessionType !== "all" && session.type !== filters.sessionType) return false;
    return filters.amount === "all" || userStatsAmountKey(session) === filters.amount;
  });
}
