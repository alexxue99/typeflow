/* eslint-disable react-hooks/set-state-in-effect -- Loading and completion state are synchronized with the remote leaderboard. */
import { useEffect, useMemo, useRef, useState } from "react";
import { createLeaderboardConfig } from "../../lib/leaderboard";
import { getLeaderboardPlayerId, loadLeaderboardInitials, saveLeaderboardInitials } from "../../lib/storage";
import type { LeaderboardEntry, LeaderboardMode, PersonalBest, Settings } from "../../lib/types";

type Props = { mode: LeaderboardMode; settings: Settings; done: boolean; score: number; accuracy: number; elapsed: number };
type LeaderboardResponse = { board?: LeaderboardEntry[]; personal?: PersonalBest | null; qualifies?: boolean; error?: string };

export function Leaderboard({ mode, settings, done, score, accuracy, elapsed }: Props) {
  const config = useMemo(() => createLeaderboardConfig(mode, settings), [mode, settings]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [personal, setPersonal] = useState<PersonalBest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInitials, setShowInitials] = useState(false);
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);
  const recorded = useRef(false);

  const request = async (method: "GET" | "POST", submittedInitials?: string) => {
    const playerId = getLeaderboardPlayerId();
    const options: RequestInit = { method, headers: { "x-typeflow-player-id": playerId } };
    let url = `/api/leaderboard?mode=${encodeURIComponent(mode)}&config=${encodeURIComponent(config.key)}`;
    if (method === "POST") {
      url = "/api/leaderboard";
      options.headers = { ...options.headers, "content-type": "application/json" };
      options.body = JSON.stringify({ mode, configKey: config.key, configLabel: config.label, score, accuracy, elapsed, initials: submittedInitials });
    }
    const response = await fetch(url, options);
    const data = await response.json() as LeaderboardResponse;
    if (!response.ok) throw new Error(data.error ?? "Leaderboard unavailable.");
    if (data.board) setBoard(data.board);
    setPersonal(data.personal ?? null);
    return data;
  };

  useEffect(() => {
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
  }, [mode, config.key]);

  useEffect(() => {
    if (!done) {
      recorded.current = false;
      setShowInitials(false);
      return;
    }
    if (recorded.current || settings.sessionType === "endless") return;
    recorded.current = true;
    setError("");
    request("POST").then((data) => {
      if (data.qualifies) {
        setInitials(loadLeaderboardInitials());
        setShowInitials(true);
      }
    }).catch(() => setError("Your personal score could not be saved."));
  // Record exactly once when the current session finishes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const submitInitials = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = initials.trim().toUpperCase();
    if (!/^[A-Z]{1,3}$/.test(clean)) return;
    setSaving(true);
    setError("");
    try {
      await request("POST", clean);
      saveLeaderboardInitials(clean);
      setShowInitials(false);
    } catch {
      setError("Your initials could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="leaderboard-card" aria-labelledby="leaderboard-title">
    <div className="leaderboard-heading">
      <div><span className="eyebrow">{mode} leaderboard</span><h2 id="leaderboard-title">Top 10</h2></div>
      {personal && <p className="personal-best">Your best <strong>{personal.score} {config.scoreLabel}</strong></p>}
    </div>
    <p className="leaderboard-settings"><strong>Settings:</strong> {config.label}</p>
    {showInitials && <form className="initials-form" onSubmit={submitInitials}>
      <div><strong>You made the top 10!</strong><span>Enter 1–3 initials to add your score. Your personal best replaces your previous entry.</span></div>
      <label>Initials<input autoFocus maxLength={3} value={initials} onChange={(event) => setInitials(event.target.value.replace(/[^a-z]/gi, "").toUpperCase())} placeholder="ABC" aria-label="Your initials" /></label>
      <button className="primary" disabled={saving || !/^[A-Z]{1,3}$/.test(initials)}>{saving ? "Saving…" : "Add score"}</button>
    </form>}
    {error ? <p className="leaderboard-message" role="status">{error}</p> : loading ? <p className="leaderboard-message">Loading scores…</p> : board.length === 0 ? <p className="leaderboard-message">No ranked scores yet. Finish a session to set the pace.</p> : <div className="leaderboard-table-wrap"><table>
      <thead><tr><th>Rank</th><th>Player</th><th>{config.scoreLabel}</th><th>Accuracy</th><th>Time</th></tr></thead>
      <tbody>{board.map((entry) => <tr key={`${entry.rank}-${entry.initials}`} className={entry.isYou ? "leaderboard-you" : undefined}><td>#{entry.rank}</td><td>{entry.initials}{entry.isYou ? <span> you</span> : null}</td><td><strong>{entry.score}</strong></td><td>{entry.accuracy}%</td><td>{entry.elapsed}s</td></tr>)}</tbody>
    </table></div>}
  </section>;
}
