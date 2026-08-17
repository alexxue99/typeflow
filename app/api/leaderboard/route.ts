import { NextResponse } from "next/server";
import { isLeaderboardMode } from "../../lib/leaderboard";

type ScoreRow = {
  player_key: string;
  initials: string | null;
  score: number;
  accuracy: number;
  elapsed: number;
};
type LeaderboardDatabase = (typeof import("cloudflare:workers"))["env"]["DB"];

let schemaReady: Promise<void> | null = null;

async function database() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("The leaderboard database is unavailable.");
  return env.DB;
}

function ensureSchema(db: LeaderboardDatabase) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS leaderboard_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_key TEXT NOT NULL,
        initials TEXT,
        mode TEXT NOT NULL,
        config_key TEXT NOT NULL,
        config_label TEXT NOT NULL,
        score INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        elapsed INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_player_config_idx ON leaderboard_scores (player_key, mode, config_key)"),
      db.prepare("CREATE INDEX IF NOT EXISTS leaderboard_rank_idx ON leaderboard_scores (mode, config_key, score DESC, accuracy DESC, elapsed ASC)"),
    ]).then(() => undefined).catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function validConfigKey(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 2 || value.length > 3000) return false;
  try { return typeof JSON.parse(value) === "object"; } catch { return false; }
}

function validScore(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

async function playerKey(request: Request, required: boolean) {
  const authenticatedEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const anonymousId = request.headers.get("x-typeflow-player-id")?.trim();
  const identity = authenticatedEmail ? `account:${authenticatedEmail}` : anonymousId && /^[a-zA-Z0-9-]{16,128}$/.test(anonymousId) ? `browser:${anonymousId}` : null;
  if (!identity) {
    if (required) throw new Error("A player identity is required.");
    return null;
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function betterThan(candidate: Pick<ScoreRow, "score" | "accuracy" | "elapsed">, existing: Pick<ScoreRow, "score" | "accuracy" | "elapsed">) {
  return candidate.score > existing.score
    || (candidate.score === existing.score && candidate.accuracy > existing.accuracy)
    || (candidate.score === existing.score && candidate.accuracy === existing.accuracy && candidate.elapsed < existing.elapsed);
}

async function readBoard(db: LeaderboardDatabase, mode: string, configKey: string, currentPlayer: string | null) {
  const result = await db.prepare(`SELECT player_key, initials, score, accuracy, elapsed
    FROM leaderboard_scores
    WHERE mode = ? AND config_key = ? AND initials IS NOT NULL
    ORDER BY score DESC, accuracy DESC, elapsed ASC, updated_at ASC
    LIMIT 10`).bind(mode, configKey).all<ScoreRow>();
  return (result.results as ScoreRow[]).map((row: ScoreRow, index: number) => ({
    rank: index + 1,
    initials: row.initials,
    score: row.score,
    accuracy: row.accuracy,
    elapsed: row.elapsed,
    isYou: row.player_key === currentPlayer,
  }));
}

export async function GET(request: Request) {
  try {
    const db = await database();
    await ensureSchema(db);
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "";
    const configKey = url.searchParams.get("config") ?? "";
    if (!isLeaderboardMode(mode) || !validConfigKey(configKey)) return NextResponse.json({ error: "Invalid leaderboard." }, { status: 400 });
    const currentPlayer = await playerKey(request, false);
    const board = await readBoard(db, mode, configKey, currentPlayer);
    const personal = currentPlayer
      ? await db.prepare("SELECT score, accuracy, elapsed FROM leaderboard_scores WHERE player_key = ? AND mode = ? AND config_key = ?")
        .bind(currentPlayer, mode, configKey).first<Pick<ScoreRow, "score" | "accuracy" | "elapsed">>()
      : null;
    return NextResponse.json({ board, personal });
  } catch (error) {
    console.error("Unable to read leaderboard", error);
    return NextResponse.json({ error: "Leaderboard unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await database();
    await ensureSchema(db);
    const currentPlayer = await playerKey(request, true);
    const body = await request.json() as Record<string, unknown>;
    const { mode, configKey, configLabel, score, accuracy, elapsed } = body;
    const submittedInitials = typeof body.initials === "string" ? body.initials.trim().toUpperCase() : "";
    if (!isLeaderboardMode(String(mode)) || !validConfigKey(configKey) || typeof configLabel !== "string" || configLabel.length < 1 || configLabel.length > 500
      || !validScore(score, -100000, 100000) || !validScore(accuracy, 0, 100) || !validScore(elapsed, 0, 86400)
      || (submittedInitials && !/^[A-Z]{1,3}$/.test(submittedInitials))) {
      return NextResponse.json({ error: "Invalid score." }, { status: 400 });
    }

    const current = await db.prepare("SELECT player_key, initials, score, accuracy, elapsed FROM leaderboard_scores WHERE player_key = ? AND mode = ? AND config_key = ?")
      .bind(currentPlayer, mode, configKey).first<ScoreRow>();
    const candidate = { score, accuracy, elapsed };
    const improved = !current || betterThan(candidate, current);
    const now = new Date().toISOString();
    if (improved) {
      await db.prepare(`INSERT INTO leaderboard_scores (player_key, initials, mode, config_key, config_label, score, accuracy, elapsed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_key, mode, config_key) DO UPDATE SET
          initials = COALESCE(excluded.initials, leaderboard_scores.initials), config_label = excluded.config_label,
          score = excluded.score, accuracy = excluded.accuracy, elapsed = excluded.elapsed, updated_at = excluded.updated_at`)
        .bind(currentPlayer, submittedInitials || null, mode, configKey, configLabel, score, accuracy, elapsed, now, now).run();
    }

    const personal = improved ? candidate : current!;
    const competitors = await db.prepare(`SELECT player_key, initials, score, accuracy, elapsed
      FROM leaderboard_scores WHERE mode = ? AND config_key = ? AND initials IS NOT NULL AND player_key <> ?
      ORDER BY score DESC, accuracy DESC, elapsed ASC, updated_at ASC LIMIT 10`)
      .bind(mode, configKey, currentPlayer).all<ScoreRow>();
    const qualifies = competitors.results.length < 10 || betterThan(personal, competitors.results[9]);

    if (submittedInitials && qualifies && (!current || improved || current.score === score && current.accuracy === accuracy && current.elapsed === elapsed)) {
      await db.prepare("UPDATE leaderboard_scores SET initials = ?, updated_at = ? WHERE player_key = ? AND mode = ? AND config_key = ?")
        .bind(submittedInitials, now, currentPlayer, mode, configKey).run();
    }

    return NextResponse.json({
      improved,
      qualifies: improved && qualifies && !submittedInitials,
      board: await readBoard(db, String(mode), configKey, currentPlayer),
      personal: { score: personal.score, accuracy: personal.accuracy, elapsed: personal.elapsed },
    });
  } catch (error) {
    console.error("Unable to record leaderboard score", error);
    return NextResponse.json({ error: "Score could not be recorded." }, { status: 503 });
  }
}
