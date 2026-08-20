/* eslint-disable react-hooks/set-state-in-effect -- Loading and completion state are synchronized with the remote leaderboard. */
import { useEffect, useMemo, useRef, useState } from "react";
import { createLeaderboardConfig, formatLeaderboardScore } from "../../lib/leaderboard";
import type { LeaderboardEntry, LeaderboardMode, PersonalBest, Settings } from "../../lib/types";

type Props = { mode: LeaderboardMode; settings: Settings; done: boolean; score: number; accuracy: number; elapsed: number; username: string | null; authAvailable: boolean; onSignIn: () => void };
type LeaderboardResponse = { board?: LeaderboardEntry[]; personal?: PersonalBest | null; error?: string };

export function Leaderboard({ mode, settings, done, score, accuracy, elapsed, username, authAvailable, onSignIn }: Props) {
  const enabled = settings.sessionType !== "endless";
  const config = useMemo(() => createLeaderboardConfig(mode, settings), [mode, settings]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [personal, setPersonal] = useState<PersonalBest | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const recorded = useRef(false);

  const request = async (method: "GET" | "POST") => {
    const options: RequestInit = { method };
    let url = `/api/leaderboard?mode=${encodeURIComponent(mode)}&config=${encodeURIComponent(config.key)}`;
    if (method === "POST") {
      url = "/api/leaderboard";
      options.headers = { "content-type": "application/json" };
      options.body = JSON.stringify({ mode, configKey: config.key, configLabel: config.label, score, accuracy, elapsed });
    }
    const response = await fetch(url, options);
    const data = await response.json() as LeaderboardResponse;
    if (!response.ok) throw new Error(data.error ?? "Leaderboard unavailable.");
    if (data.board) setBoard(data.board);
    setPersonal(data.personal ?? null);
  };

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    request("GET").catch(() => {
      if (!cancelled) setError("The leaderboard is temporarily unavailable.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  // A canonical key changes only when a competitive setting changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, config.key, enabled, username]);

  useEffect(() => {
    if (!done) {
      recorded.current = false;
      return;
    }
    if (recorded.current || !enabled || !username) return;
    recorded.current = true;
    setError("");
    request("POST").catch(() => setError("Your personal score could not be saved."));
  // Record exactly once when the current session finishes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, enabled, username]);

  if (!enabled) return null;

  return <section className="leaderboard-card" aria-labelledby="leaderboard-title">
    <div className="leaderboard-heading">
      <div><span className="eyebrow">{mode} leaderboard</span>
      <p className="leaderboard-settings"> {config.label.split(" · ").map((label, index) => <span key={`${label}-${index}`} style={index > 0 ? { color: "var(--muted)", fontSize: "13px" } : undefined}>{index > 0 ? " · " : ""}{label}</span>)}</p>
      <h2 id="leaderboard-title">Top 10</h2>
    </div>
      {personal && <p className="personal-best">Your best <strong>{formatLeaderboardScore(personal.score, config)}</strong></p>}
    </div>
    {!username && <p className="score-sign-in">Scores are saved only for signed-in users. {authAvailable ? <><button className="auth-text-button" onClick={onSignIn}>Sign in</button> before finishing a session to record yours.</> : "Authentication is not configured for this deployment."}</p>}
    {error ? <p className="leaderboard-message" role="status">{error}</p> : loading ? <p className="leaderboard-message">Loading scores…</p> : board.length === 0 ? <p className="leaderboard-message">No ranked scores yet. Finish a session to set the pace.</p> : <div className="leaderboard-table-wrap"><table>
      <thead><tr><th>Rank</th><th>Username</th><th>{config.scoreLabel === "points" ? "Points" : config.scoreLabel}</th><th>Accuracy</th></tr></thead>
      <tbody>{board.map((entry) => <tr key={`${entry.rank}-${entry.username}`} className={entry.isYou ? "leaderboard-you" : undefined}><td>#{entry.rank}</td><td>{entry.username}{entry.isYou ? <span> you</span> : null}</td><td><strong>{formatLeaderboardScore(entry.score, config)}</strong></td><td>{entry.accuracy}%</td></tr>)}</tbody>
    </table></div>}
  </section>;
}
