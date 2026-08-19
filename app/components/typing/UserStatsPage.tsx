/* eslint-disable react-hooks/set-state-in-effect -- Stats are loaded when this client-side page is opened. */
import { useEffect, useState } from "react";
import { isTimeLeaderboard } from "../../lib/leaderboard";
import type { UserBest } from "../../lib/types";

type StatsResponse = { username?: string; bests?: UserBest[]; error?: string };

function formatScore(best: UserBest) {
  if (isTimeLeaderboard(best.mode, best.configKey)) return `${(best.score / 1000).toFixed(3)}s`;
  return `${best.score} ${best.mode === "keyboardshot" ? "points" : "WPM"}`;
}

export function UserStatsPage({ username, authAvailable, onSignIn }: { username: string | null; authAvailable: boolean; onSignIn: () => void }) {
  const [bests, setBests] = useState<UserBest[]>([]);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState("");

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

  if (!username) return <section className="content-page user-stats-page">
    <div className="page-title"><div><span className="eyebrow">User stats</span><h1>Your personal bests.</h1></div></div>
    <div className="empty-state"><h2>Sign in to build your stats.</h2><p>{authAvailable ? "Only scores completed while signed in are saved." : "Authentication is not configured for this deployment."}</p>{authAvailable && <button className="button-link user-stats-sign-in" onClick={onSignIn}>Sign in</button>}</div>
  </section>;

  return <section className="content-page user-stats-page">
    <div className="page-title"><div><span className="eyebrow">User stats</span><h1>{username}&apos;s bests.</h1><p>Your best saved performance for every competitive mode and setting combination.</p></div></div>
    {error ? <div className="empty-state" role="status"><h2>Stats unavailable.</h2><p>{error}</p></div>
      : loading ? <p className="leaderboard-message">Loading your bests…</p>
        : bests.length === 0 ? <div className="empty-state"><h2>No saved performances yet.</h2><p>Complete a finite Flow, Zen, Freedom, or Keyboardshot session while signed in.</p></div>
          : <div className="table-card user-stats-table"><table><thead><tr><th>Mode</th><th>Settings</th><th>Best</th><th>Accuracy</th><th>Time</th></tr></thead><tbody>{bests.map((best) => <tr key={`${best.mode}-${best.configKey}`}><td className="stats-mode">{best.mode}</td><td>{best.configLabel}</td><td><strong>{formatScore(best)}</strong></td><td>{best.accuracy}%</td><td>{isTimeLeaderboard(best.mode, best.configKey) ? "—" : `${best.elapsed}s`}</td></tr>)}</tbody></table></div>}
  </section>;
}
