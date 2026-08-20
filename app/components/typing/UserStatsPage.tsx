/* eslint-disable react-hooks/set-state-in-effect -- Stats are loaded when this client-side page is opened. */
import { useEffect, useState } from "react";
import { isTimeLeaderboard } from "../../lib/leaderboard";
import type { LeaderboardMode, UserBest } from "../../lib/types";
import { filterUserBests, readUserStatsSession, userStatsAmountKey, userStatsRulesLabel, type UserStatsSession, type UserStatsSessionType } from "../../lib/userStats";

type StatsResponse = { username?: string; bests?: UserBest[]; error?: string };

function formatScore(best: UserBest) {
  if (isTimeLeaderboard(best.mode, best.configKey)) return `${(best.score / 1000).toFixed(3)}s`;
  const score = best.mode === "keyboardshot" ? best.score : best.score / 100;
  return `${score} ${best.mode === "keyboardshot" ? "points" : "WPM"}`;
}

const MODE_OPTIONS: { value: LeaderboardMode; label: string }[] = [
  { value: "flow", label: "Flow" },
  { value: "zen", label: "Zen" },
  { value: "cadence", label: "Cadence" },
  { value: "keyboardshot", label: "Keyboardshot" },
];

function amountLabel(type: UserStatsSessionType, amount: number, units: Set<string>) {
  if (type === "time") return `time ${amount}`;
  if (units.size === 1) return `${Array.from(units)[0]} ${amount}`;
  return `words / blocks / targets  ${Array.from(units)[0]}`;
}

function sessionAmountLabel(session: UserStatsSession | null) {
  return session ? amountLabel(session.type, session.amount, new Set([session.unit])) : "—";
}

export function UserStatsPage({ username, authAvailable, onSignIn }: { username: string | null; authAvailable: boolean; onSignIn: () => void }) {
  const [bests, setBests] = useState<UserBest[]>([]);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState("");
  const [modeFilter, setModeFilter] = useState<LeaderboardMode | "all">("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<UserStatsSessionType | "all">("all");
  const [amountFilter, setAmountFilter] = useState("all");

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch("/api/user-stats")
      .then(async (response) => {
        const data = await response.json() as StatsResponse;
        if (!response.ok) throw new Error(data.error ?? "User stats are unavailable.");
        if (!cancelled) setBests(data.bests ?? []);
      })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "User stats are unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  const sessionsForAmountFilter = bests
    .filter((best) => modeFilter === "all" || best.mode === modeFilter)
    .map(readUserStatsSession)
    .filter((session) => session && (sessionTypeFilter === "all" || session.type === sessionTypeFilter));
  const amountOptions = Array.from(sessionsForAmountFilter.reduce((options, session) => {
    if (!session) return options;
    const key = userStatsAmountKey(session);
    const option = options.get(key) ?? { type: session.type, amount: session.amount, units: new Set<string>() };
    option.units.add(session.unit);
    options.set(key, option);
    return options;
  }, new Map<string, { type: UserStatsSessionType; amount: number; units: Set<string> }>()).entries())
    .sort(([, left], [, right]) => left.type.localeCompare(right.type) || left.amount - right.amount);
  const filteredBests = filterUserBests(bests, { mode: modeFilter, sessionType: sessionTypeFilter, amount: amountFilter });
  const resultsHeight = Math.max(180, Math.min(bests.length, 10) * 64 + 92);

  if (!username) return <section className="content-page user-stats-page">
    <div className="page-title"><div><span className="eyebrow">User stats</span><h1>Your personal bests.</h1></div></div>
    <div className="empty-state"><h2>Sign in to build your stats.</h2><p>{authAvailable ? "Only scores completed while signed in are saved." : "Authentication is not configured for this deployment."}</p>{authAvailable && <button className="button-link user-stats-sign-in" onClick={onSignIn}>Sign in</button>}</div>
  </section>;

  return <section className="content-page user-stats-page">
    <div className="page-title"><div><span className="eyebrow">User stats</span><h1>{username}&apos;s bests.</h1><p>Your best saved performance for every competitive mode and setting combination.</p></div></div>
    {error ? <div className="empty-state" role="status"><h2>Stats unavailable.</h2><p>{error}</p></div>
      : loading ? <p className="leaderboard-message">Loading your bests…</p>
        : bests.length === 0 ? <div className="empty-state"><h2>No saved performances yet.</h2><p>Complete a Flow, Zen, Cadence, or Keyboardshot session while signed in.</p></div>
          : <>
            <div className="user-stats-filters" aria-label="Filter personal bests">
              <label>Game mode<select value={modeFilter} onChange={(event) => { setModeFilter(event.target.value as LeaderboardMode | "all"); setAmountFilter("all"); }}><option value="all">All modes</option>{MODE_OPTIONS.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
              <label>Session type<select value={sessionTypeFilter} onChange={(event) => { setSessionTypeFilter(event.target.value as UserStatsSessionType | "all"); setAmountFilter("all"); }}><option value="all">Both types</option><option value="time">Time</option><option value="words">Words</option></select></label>
              <label>Time / word count<select value={amountFilter} onChange={(event) => setAmountFilter(event.target.value)}><option value="all">All amounts</option>{amountOptions.map(([key, option]) => <option key={key} value={key}>{amountLabel(option.type, option.amount, option.units)}</option>)}</select></label>
            </div>
            <div className="user-stats-results" style={{ height: resultsHeight }}>
              {filteredBests.length === 0
                ? <div className="empty-state user-stats-filter-empty"><h2>No matching performances.</h2><p>Try a different combination of filters.</p></div>
                : <div className="table-card user-stats-table"><table><thead><tr><th>Mode</th><th>Test Type</th><th>Settings</th><th>Best</th><th>Accuracy</th></tr></thead><tbody>{filteredBests.map((best) => {
                  const session = readUserStatsSession(best);
                  return <tr key={`${best.mode}-${best.configKey}`}><td className="stats-mode">{best.mode}</td><td className="stats-session-amount">{sessionAmountLabel(session)}</td><td>{userStatsRulesLabel(best)}</td><td><strong>{formatScore(best)}</strong></td><td>{best.accuracy}%</td></tr>;
                })}</tbody></table></div>}
            </div>
          </>}
  </section>;
}
